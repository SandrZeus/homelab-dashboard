package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SandrZeus/homelab-dashboard/internal/servicepatrol"
)

type CapabilitiesHandler struct {
	servicepatrol *servicepatrol.Checker
}

func NewCapabilitiesHandler(spChecker *servicepatrol.Checker) *CapabilitiesHandler {
	return &CapabilitiesHandler{servicepatrol: spChecker}
}

func (h *CapabilitiesHandler) Get(w http.ResponseWriter, r *http.Request) {
	capabilities := map[string]bool{
		"servicepatrol": false,
	}
	if h.servicepatrol != nil {
		capabilities["servicepatrol"] = h.servicepatrol.Connected()
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(capabilities); err != nil {
		log.Printf("capabilities: encode failed: %v", err)
	}
}
