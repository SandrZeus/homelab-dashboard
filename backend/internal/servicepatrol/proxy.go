package servicepatrol

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func NewProxy(upstreamURL string) (*httputil.ReverseProxy, error) {
	target, err := url.Parse(upstreamURL)
	if err != nil {
		return nil, err
	}

	proxy := &httputil.ReverseProxy{
		FlushInterval: -1,
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(target)
			r.Out.URL.Path = "/api" + strings.TrimPrefix(r.Out.URL.Path, "/api/servicepatrol")
			r.Out.URL.RawPath = "/api" + strings.TrimPrefix(r.Out.URL.RawPath, "/api/servicepatrol")
			if r.Out.URL.Path == "" {
				r.Out.URL.Path = "/"
			}
			r.Out.Header.Del("Accept-Emcoding")
		},
		ModifyResponse: func(r *http.Response) error {
			r.Header.Del("Access-Control-Allow-Origin")
			r.Header.Del("Access-Control-Allow-Methods")
			r.Header.Del("Access-Control-Allow-Headers")
			r.Header.Del("Access-Control-Allow-Credentials")
			return nil
		},
	}

	return proxy, nil
}
