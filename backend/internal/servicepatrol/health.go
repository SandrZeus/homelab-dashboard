package servicepatrol

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"
)

type Checker struct {
	upstreamURL string
	client      *http.Client
	mu          sync.Mutex
	connected   bool
}

func NewChecker(upstreamURL string) *Checker {
	return &Checker{
		upstreamURL: upstreamURL,
		client: &http.Client{
			Timeout: 3 * time.Second,
		},
	}
}

func (c *Checker) Start(ctx context.Context) {
	go c.run(ctx)
}

func (c *Checker) Connected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.connected
}

func (c *Checker) run(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	c.check(ctx)

	for {
		select {
		case <-ticker.C:
			c.check(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (c *Checker) check(ctx context.Context) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.upstreamURL+"/api/targets", nil)
	if err != nil {
		c.setConnected(false)
		return
	}

	resp, err := c.client.Do(req)
	if err != nil {
		c.setConnected(false)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("servicepatrol: close response body: %v", err)
		}
	}()

	ok := resp.StatusCode >= 200 && resp.StatusCode < 300
	c.setConnected(ok)
}

func (c *Checker) setConnected(next bool) {
	c.mu.Lock()
	prev := c.connected
	c.connected = next
	c.mu.Unlock()

	if prev != next {
		if next {
			log.Printf("servicepatrol: connected")
		} else {
			log.Printf("servicepatrol: disconnected")
		}
	}
}
