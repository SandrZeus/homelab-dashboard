package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SandrZeus/homelab-dashboard/internal/prometheus"
)

type MetricsHandler struct {
	client *prometheus.Client
}

func NewMetricsHandler(client *prometheus.Client) *MetricsHandler {
	return &MetricsHandler{client: client}
}

func (h *MetricsHandler) GetSystemMetrics(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.client.GetSystemMetrics()
	if err != nil {
		log.Printf("failed to fetch metrics: %v", err)
		http.Error(w, "failed to fetch metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}
