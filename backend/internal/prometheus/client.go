package prometheus

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type Client struct {
	baseUrl    string
	httpClient *http.Client
}

func NewClient(baseUrl string) *Client {
	return &Client{
		baseUrl: baseUrl,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type queryResult struct {
	Data struct {
		Result []struct {
			Value [2]any `json:"value"`
		} `json:"result"`
	} `json:"data"`
}

func (c *Client) queryScalar(query string) (float64, error) {
	endpoint := fmt.Sprintf("%s/api/v1/query?query=%s", c.baseUrl, url.QueryEscape(query))
	resp, err := c.httpClient.Get(endpoint)
	if err != nil {
		return 0, fmt.Errorf("querying prometheus: %w", err)
	}
	defer resp.Body.Close()

	var result queryResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("decoding response: %w", err)
	}

	if len(result.Data.Result) == 0 {
		return 0, nil
	}

	val, ok := result.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("unexpected value type")
	}

	return strconv.ParseFloat(val, 64)
}

type SystemMetricts struct {
	CPUUsagePercent    float64 `json:"cpuUsagePercent"`
	MemoryUsagePercent float64 `json:"memoryUsagePercent"`
	MemoryUsedBytes    float64 `json:"memoryUsedBytes"`
	MemoryTotalBytes   float64 `json:"memoryTotalBytes"`
	DiskUsagePercent   float64 `json:"diskUsagePercent"`
	DiskUsedBytes      float64 `json:"diskUsedBytes"`
	DiskTotalBytes     float64 `json:"diskTotalBytes"`
	UptimeSeconds      float64 `json:"uptimeSeconds"`
}

func (c *Client) GetSystemMetrics() (*SystemMetricts, error) {
	type queryDef struct {
		query string
		dest  *float64
	}

	m := &SystemMetricts{}

	queries := []queryDef{
		{`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)`, &m.CPUUsagePercent},
		{`(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`, &m.MemoryUsagePercent},
		{`node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes`, &m.MemoryUsedBytes},
		{`node_memory_MemTotal_bytes`, &m.MemoryTotalBytes},
		{`(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100`, &m.DiskUsagePercent},
		{`node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}`, &m.DiskUsedBytes},
		{`node_filesystem_size_bytes{mountpoint="/"}`, &m.DiskTotalBytes},
		{`node_time_seconds - node_boot_time_seconds`, &m.UptimeSeconds},
	}

	for _, q := range queries {
		val, err := c.queryScalar(q.query)
		if err != nil {
			return nil, fmt.Errorf("query %q failed: %w", q.query, err)
		}
		*q.dest = val
	}

	return m, nil
}
