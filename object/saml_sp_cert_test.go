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

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"math/big"
	"testing"
	"time"
)

func newTestCert(t *testing.T, cn string) ([]byte, *x509.Certificate) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber: big.NewInt(time.Now().UnixNano()),
		Subject:      pkix.Name{CommonName: cn},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	return der, cert
}

// CVE-2026-9090: the trust store must only contain the configured IdP certificate,
// never a certificate supplied inside the SAMLResponse.
func TestBuildSpCertificateStoreIgnoresResponseCertificate(t *testing.T) {
	idpDer, idpCert := newTestCert(t, "trusted-idp")
	attackerDer, _ := newTestCert(t, "attacker")

	forgedResponse := base64.StdEncoding.EncodeToString([]byte(
		"<samlp:Response><ds:Signature><ds:KeyInfo><ds:X509Data><ds:X509Certificate>" +
			base64.StdEncoding.EncodeToString(attackerDer) +
			"</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature></samlp:Response>"))

	provider := &Provider{
		Name: "saml-test",
		Type: "Keycloak",
		IdP:  string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: idpDer})),
	}

	store, err := buildSpCertificateStore(provider, forgedResponse)
	if err != nil {
		t.Fatal(err)
	}
	if len(store.Roots) != 1 || !store.Roots[0].Equal(idpCert) {
		t.Fatalf("trust store must contain only the configured IdP certificate, got %v", store.Roots)
	}

	// Base64 (non-PEM) configured certificates keep working
	provider.IdP = base64.StdEncoding.EncodeToString(idpDer)
	store, err = buildSpCertificateStore(provider, forgedResponse)
	if err != nil || !store.Roots[0].Equal(idpCert) {
		t.Fatalf("base64 IdP certificate not used: %v", err)
	}

	// No configured certificate: refuse instead of trusting the response
	provider.IdP = ""
	if _, err = buildSpCertificateStore(provider, forgedResponse); err == nil {
		t.Fatal("expected an error when no IdP certificate is configured")
	}
}
