package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SandrZeus/homelab-dashboard/internal/k3s"
)

type PodsHandler struct {
	client *k3s.Client
}

func NewPodsHandler(client *k3s.Client) *PodsHandler {
	return &PodsHandler{client: client}
}

func (h *PodsHandler) GetPods(w http.ResponseWriter, r *http.Request) {
	pods, err := h.client.GetPods()
	if err != nil {
		log.Printf("failed to fetch pods: %v", err)
		http.Error(w, "failed to fetch pods", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pods)
}
