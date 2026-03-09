package ws

import (
	"log"
	"time"

	"github.com/SandrZeus/homelab-dashboard/internal/k3s"
	"github.com/SandrZeus/homelab-dashboard/internal/prometheus"
)

type DashboardUpdate struct {
	Type    string `json:"type"`
	Pods    any    `json:"pods,omitempty"`
	Metrics any    `json:"metrics,omitempty"`
}

func (h *Hub) StartBroadcaster(k3sClient *k3s.Client, promClient *prometheus.Client) {
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		h.broadcastUpdate(k3sClient, promClient)

		for range ticker.C {
			h.broadcastUpdate(k3sClient, promClient)
		}
	}()
}

func (h *Hub) broadcastUpdate(k3sClient *k3s.Client, promClient *prometheus.Client) {
	pods, err := k3sClient.GetPods()
	if err != nil {
		log.Printf("braodcaster: failed to get pods: %v", err)
		return
	}

	metrics, err := promClient.GetSystemMetrics()
	if err != nil {
		log.Printf("broadcaster: failed to get metrics: %v", err)
		return
	}

	h.Broadcast(DashboardUpdate{
		Type:    "update",
		Pods:    pods,
		Metrics: metrics,
	})
}
