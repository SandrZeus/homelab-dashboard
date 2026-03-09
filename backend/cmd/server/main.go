package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/SandrZeus/homelab-dashboard/internal/api/handlers"
	"github.com/SandrZeus/homelab-dashboard/internal/api/middleware"
	"github.com/SandrZeus/homelab-dashboard/internal/auth"
	"github.com/SandrZeus/homelab-dashboard/internal/config"
	"github.com/SandrZeus/homelab-dashboard/internal/k3s"
	"github.com/SandrZeus/homelab-dashboard/internal/prometheus"
	"github.com/SandrZeus/homelab-dashboard/internal/ws"
	"github.com/joho/godotenv"
)

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

	addr := ":" + cfg.ServerPort
	log.Printf("server started on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
