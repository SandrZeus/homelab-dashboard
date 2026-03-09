package middleware

import (
	"net/http"
	"strings"

	"github.com/SandrZeus/homelab-dashboard/internal/auth"
)

func Auth(authService *auth.Service, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "missing or invalide authorization header", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if _, err := authService.ValidateToken(tokenStr); err != nil {
			http.Error(w, "invalide token", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}
