package config

import (
	"log"
	"os"
)

type Config struct {
	ServerPort     string
	KubeconfigPath string
	K3sAPIURL      string
	K3sToken       string
	PrometheusURL  string
	JWTSecret      string
	AdminEmail     string
	AdminPassword  string
}

func Load() *Config {
	cfg := &Config{
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		KubeconfigPath: getEnv("KUBECONFIG_PATH", ""),
		K3sAPIURL:      getEnv("K3S_API_URL", "https://127.0.0.1:6443"),
		K3sToken:       getEnv("K3S_TOKEN", ""),
		PrometheusURL:  getEnv("PROMETHEUS_URL", "http://127.0.0.1:30086"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		AdminEmail:     getEnv("ADMIN_EMAIL", ""),
		AdminPassword:  getEnv("ADMIN_PASSWORD", ""),
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	if cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		log.Fatal("ADMIN_EMAIL abd ADMIN_PASSWORD are required")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}

	return fallback
}
