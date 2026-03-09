package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/SandrZeus/homelab-dashboard/internal/api/handlers"
	"github.com/SandrZeus/homelab-dashboard/internal/config"
	"github.com/SandrZeus/homelab-dashboard/internal/k3s"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	cfg := config.Load()

	k3sClient, err := k3s.NewClient(cfg.KubeconfigPath, cfg.K3sAPIURL)
	if err != nil {
		log.Fatalf("failed to create k3s client: %v", err)
	}

	podsHandler := handlers.NewPodsHandler(k3sClient)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})
	mux.HandleFunc("/api/pods", podsHandler.GetPods)

	addr := ":" + cfg.ServerPort
	log.Printf("server started on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
