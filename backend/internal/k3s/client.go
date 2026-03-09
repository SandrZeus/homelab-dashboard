package k3s

import (
	"context"
	"fmt"
	"log"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

type Client struct {
	clientset        *kubernetes.Clientset
	metricsClientset *versioned.Clientset
}

func NewClient(kubeconfigPath string) (*Client, error) {
	var cfg *rest.Config
	var err error

	if kubeconfigPath != "" {
		cfg, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	} else {
		cfg, err = rest.InClusterConfig()
	}
	if err != nil {
		return nil, fmt.Errorf("building k3s config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("creating k3s clientset: %w", err)
	}

	metricsClientset, err := versioned.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("creating metrics clientset: %w", err)
	}

	return &Client{clientset: clientset, metricsClientset: metricsClientset}, nil
}

type PodSummary struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Phase       string `json:"phase"`
	Node        string `json:"node"`
	Restarts    int    `json:"restarts"`
	Ready       bool   `json:"ready"`
	Age         string `json:"age"`
	CPUCores    int64  `json:"cpuCores"`
	MemoryBytes int64  `json:"memoryBytes"`
}

func (c *Client) GetPods() ([]PodSummary, error) {
	pods, err := c.clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("listing pods: %w", err)
	}

	podMetrics, err := c.metricsClientset.MetricsV1beta1().PodMetricses("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		log.Printf("warning: could not fetch pod metrics: %v", err)
	}

	type resourceUsage struct {
		cpuMillicores int64
		memoryBytes   int64
	}
	usageMap := map[string]resourceUsage{}
	if podMetrics != nil {
		for _, pm := range podMetrics.Items {
			key := pm.Namespace + "/" + pm.Name
			var cpu, mem int64
			for _, c := range pm.Containers {
				cpu += c.Usage.Cpu().MilliValue()
				mem += c.Usage.Memory().Value()
			}
			usageMap[key] = resourceUsage{cpuMillicores: cpu, memoryBytes: mem}
		}
	}

	summaries := make([]PodSummary, 0, len(pods.Items))
	for _, p := range pods.Items {
		s := podToSummary(p)
		if usage, ok := usageMap[p.Namespace+"/"+p.Name]; ok {
			s.CPUCores = usage.cpuMillicores
			s.MemoryBytes = usage.memoryBytes
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

func podToSummary(p v1.Pod) PodSummary {
	restarts := 0
	ready := true
	for _, cs := range p.Status.ContainerStatuses {
		restarts += int(cs.RestartCount)
		if !cs.Ready {
			ready = false
		}
	}

	return PodSummary{
		Name:      p.Name,
		Namespace: p.Namespace,
		Phase:     string(p.Status.Phase),
		Node:      p.Spec.NodeName,
		Restarts:  restarts,
		Ready:     ready,
		Age:       age(p.CreationTimestamp.Time),
	}
}

func age(t time.Time) string {
	d := time.Since(t)
	switch {
	case d < time.Hour:
		return fmt.Sprintf("%dm", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	}
}
