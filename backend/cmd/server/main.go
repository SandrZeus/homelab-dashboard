package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"strings"

	"github.com/SandrZeus/homelab-dashboard/internal/api/handlers"
	"github.com/SandrZeus/homelab-dashboard/internal/api/middleware"
	"github.com/SandrZeus/homelab-dashboard/internal/auth"
	"github.com/SandrZeus/homelab-dashboard/internal/config"
	"github.com/SandrZeus/homelab-dashboard/internal/k3s"
	"github.com/SandrZeus/homelab-dashboard/internal/prometheus"
	"github.com/SandrZeus/homelab-dashboard/internal/servicepatrol"
	"github.com/SandrZeus/homelab-dashboard/internal/ws"
	"github.com/joho/godotenv"
)

//go:embed static
var staticFiles embed.FS

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	cfg := config.Load()

	k3sClient, err := k3s.NewClient(cfg.KubeconfigPath)
	if err != nil {
		log.Fatalf("failed to create k3s client: %v", err)
	}

	promClient := prometheus.NewClient(cfg.PrometheusURL)

	authService := auth.NewService(cfg.JWTSecret)
	authHandler, err := handlers.NewAuthHandler(authService, cfg.AdminEmail, cfg.AdminPassword)
	if err != nil {
		log.Fatalf("failed to create auth handler: %v", err)
	}

	var spChecker *servicepatrol.Checker
	if cfg.ServicePatrolURL != "" {
		spChecker = servicepatrol.NewChecker(cfg.ServicePatrolURL)
		spChecker.Start(context.Background())
		log.Printf("servicepatrol enabled: %s", cfg.ServicePatrolURL)
	} else {
		log.Printf("servicepatrol disabled: no ServicePatrolURL configured")
	}

	capabilitiesHandler := handlers.NewCapabilitiesHandler(spChecker)

	var spProxy *httputil.ReverseProxy
	if cfg.ServicePatrolURL != "" {
		var err error
		spProxy, err = servicepatrol.NewProxy(cfg.ServicePatrolURL)
		if err != nil {
			log.Fatalf("failed to create servicepatrol proxy: %v", err)
		}
	}

	podsHandler := handlers.NewPodsHandler(k3sClient)
	metricsHandler := handlers.NewMetricsHandler(promClient)

	hub := ws.NewHub()
	go hub.Run()
	hub.StartBroadcaster(k3sClient, promClient)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.HandleFunc("/api/auth/refresh", authHandler.Refresh)

	mux.HandleFunc("/api/pods", middleware.Auth(authService, podsHandler.GetPods))
	mux.HandleFunc("/api/metrics/system", middleware.Auth(authService, metricsHandler.GetSystemMetrics))
	mux.HandleFunc("/ws", middleware.Auth(authService, hub.ServeWS))

	mux.HandleFunc("/api/capabilities", capabilitiesHandler.Get)

	if spProxy != nil {
		mux.Handle("/api/servicepatrol/", middleware.Auth(authService, spProxy.ServeHTTP))
	}

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := "static" + r.URL.Path
		if r.URL.Path == "/" {
			path = "static/index.html"
		}

		content, err := staticFiles.ReadFile(path)
		if err != nil {
			log.Printf("read failed: %v, trying index.html", err)
			content, err = staticFiles.ReadFile("static/index.html")
			if err != nil {
				log.Printf("index.html also failed: %v", err)
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
		}

		switch {
		case strings.HasSuffix(path, ".html"):
			w.Header().Set("Content-Type", "text/html")
		case strings.HasSuffix(path, ".js"):
			w.Header().Set("Content-Type", "application/javascript")
		case strings.HasSuffix(path, ".css"):
			w.Header().Set("Content-Type", "text/css")
		case strings.HasSuffix(path, ".svg"):
			w.Header().Set("Content-Type", "image/svg+xml")
		case strings.HasSuffix(path, ".ico"):
			w.Header().Set("Content-Type", "image/x-icon")
		}

		w.Write(content)
	})

	addr := ":" + cfg.ServerPort
	log.Printf("server started on %s", addr)
	if err := http.ListenAndServe(addr, middleware.CORS(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
