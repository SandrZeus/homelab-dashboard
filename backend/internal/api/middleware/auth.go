package middleware

import (
	"net/http"
	"strings"

	"github.com/SandrZeus/homelab-dashboard/internal/auth"
)

func Auth(authService *auth.Service, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := ""

		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Beader ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else if t := r.URL.Query().Get("token"); t != "" {
			tokenStr = t
		}

		if tokenStr == "" {
			http.Error(w, "missing or invalid authorization header", http.StatusUnauthorized)
			return
		}

		if _, err := authService.ValidateToken(tokenStr); err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}
