// Copyright 2026 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package object

import "testing"

// CVE-2026-5467: redirect_uri must not be accepted because a registered entry appears somewhere inside it.
func TestIsRedirectUriValid(t *testing.T) {
	application := &Application{
		RedirectUris: []string{
			"https://app.example.com/callback",
			"https://portal.example.com",
			"mobile.example.com",
			`https://[a-z0-9-]+\.preview\.example\.com/auth/callback`,
			"https://pinned.example.com/cb?tenant=a",
		},
	}

	cases := []struct {
		uri  string
		want bool
	}{
		// legitimate
		{"https://app.example.com/callback", true},
		{"https://app.example.com/callback?foo=bar", true},
		{"https://app.example.com/callback/sub", true},
		{"https://portal.example.com/", true},
		{"https://portal.example.com/any/path", true},
		{"HTTPS://PORTAL.EXAMPLE.COM/x", true},
		{"https://mobile.example.com/cb", true},
		{"https://pr-12.preview.example.com/auth/callback", true},
		{"https://pinned.example.com/cb?tenant=a", true},
		{"http://localhost:3000/callback", true}, // dev origins stay allowed (util.IsValidOrigin)

		// attacks: registered entry embedded in a foreign URL
		{"https://evil.com/?next=https://app.example.com/callback", false},
		{"https://evil.com/https://app.example.com/callback", false},
		{"https://app.example.com.evil.com/callback", false},
		{"https://app.example.com@evil.com/callback", false},
		{"https://appXexample.com/callback", false},
		{"https://evil.com#https://portal.example.com", false},
		{"https://portal.example.com.evil.com/", false},
		{"http://portal.example.com/", false},       // scheme downgrade
		{"https://portal.example.com:8443/", false}, // other port
		{"https://app.example.com/callbackevil", false},
		{"https://app.example.com/other", false},
		{"https://evil.mobile.example.com.attacker.io/", false},
		{"https://x.preview.example.com/auth/callback.evil.com", false},
		{"https://evil.com/?https://pr-1.preview.example.com/auth/callback", false},
		{"https://pinned.example.com/cb?tenant=b", false},
		{"", false},
	}

	for _, c := range cases {
		if got := application.IsRedirectUriValid(c.uri); got != c.want {
			t.Errorf("IsRedirectUriValid(%q) = %v, want %v", c.uri, got, c.want)
		}
	}
}
