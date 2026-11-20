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
// The legitimate cases follow upstream's matcher (redirectUriMatchesPattern): exact URL, same origin and
// path with any query, and bare hosts (which also cover their subdomains).
func TestIsRedirectUriValid(t *testing.T) {
	application := &Application{
		RedirectUris: []string{
			"https://app.example.com/callback",
			"https://portal.example.com",
			"mobile.example.com",
		},
	}

	cases := []struct {
		uri  string
		want bool
	}{
		// legitimate
		{"https://app.example.com/callback", true},
		{"https://app.example.com/callback?foo=bar", true},
		{"https://portal.example.com", true},
		{"https://mobile.example.com/cb", true},
		{"https://eu.mobile.example.com/cb", true},

		// attacks: registered entry embedded in a foreign URL
		{"https://evil.com/?next=https://app.example.com/callback", false},
		{"https://evil.com/https://app.example.com/callback", false},
		{"https://app.example.com.evil.com/callback", false},
		{"https://app.example.com@evil.com/callback", false},
		{"https://appXexample.com/callback", false},
		{"https://evil.com#https://portal.example.com", false},
		{"https://portal.example.com.evil.com/", false},
		{"http://portal.example.com/", false}, // scheme downgrade
		{"https://app.example.com/callbackevil", false},
		{"https://app.example.com/other", false},
		{"https://evil.mobile.example.com.attacker.io/", false},
		{"https://evilmobile.example.com/", false},
		{"javascript:alert(1)//https://app.example.com/callback", false},
		{"", false},
	}

	for _, c := range cases {
		if got := application.IsRedirectUriValid(c.uri); got != c.want {
			t.Errorf("IsRedirectUriValid(%q) = %v, want %v", c.uri, got, c.want)
		}
	}
}
