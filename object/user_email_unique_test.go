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
	"path/filepath"
	"testing"

	"github.com/xorm-io/xorm"
	"github.com/xorm-io/xorm/names"
)

func TestUserEmailUniqueSqlite(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "test.db")
	engine, err := xorm.NewEngine("sqlite", dbPath)
	if err != nil {
		t.Fatal(err)
	}
	engine.SetTableMapper(names.NewPrefixMapper(names.GonicMapper{}, ""))
	engine.SetColumnMapper(names.GonicMapper{})
	defer engine.Close()
	a := &Ormer{driverName: "sqlite", Engine: engine}

	// Pre-existing data with a mixed-case email, inserted before the migration exists
	if err = engine.Sync2(new(User)); err != nil {
		t.Fatal(err)
	}
	if _, err = engine.Exec("INSERT INTO user (owner, name, email) VALUES ('org', 'alice', '  Alice@Example.COM ')"); err != nil {
		t.Fatal(err)
	}

	for i := 0; i < 3; i++ { // simulate several restarts
		if err = engine.Sync2(new(User)); err != nil {
			t.Fatalf("sync2 run %d: %v", i, err)
		}
		if err = a.ensureUserEmailUnique(); err != nil {
			t.Fatalf("ensure run %d: %v", i, err)
		}
		generated, err := a.isUserEmailUniqueColumnGenerated()
		if err != nil || !generated {
			t.Fatalf("run %d: column not generated (%v)", i, err)
		}
	}

	res, _ := engine.QueryString("SELECT email, email_unique FROM user WHERE name = 'alice'")
	t.Logf("alice after migration: %v", res)
	if res[0]["email"] != "alice@example.com" {
		t.Fatalf("email not normalized: %v", res)
	}

	// Raw inserts that bypass the application checks
	insert := func(owner, name, email string) error {
		_, err := engine.Insert(&User{Owner: owner, Name: name, Email: email})
		return err
	}
	if err = insert("org", "bob", "ALICE@example.com"); err == nil || !isUserEmailUniqueViolation(err) {
		t.Fatalf("expected unique violation for case variant, got %v", err)
	}
	t.Logf("case-variant duplicate rejected by DB: %v -> %v", err, wrapUserEmailUniqueError(err, "en"))
	if err = insert("other-org", "bob", "alice@example.com"); err != nil {
		t.Fatalf("same email in another org must be allowed: %v", err)
	}
	if err = insert("org", "e1", ""); err != nil {
		t.Fatal(err)
	}
	if err = insert("org", "e2", ""); err != nil {
		t.Fatalf("several empty emails must be allowed: %v", err)
	}

	// Update into a duplicate is rejected too
	_, err = engine.ID([]interface{}{"org", "e1"}).Cols("email").Update(&User{Email: "alice@example.com"})
	if !isUserEmailUniqueViolation(err) {
		t.Fatalf("expected violation on update, got %v", err)
	}

	// Pre-existing duplicates make startup fail with a clear message
	engine2, _ := xorm.NewEngine("sqlite", filepath.Join(t.TempDir(), "dup.db"))
	engine2.SetColumnMapper(names.GonicMapper{})
	defer engine2.Close()
	b := &Ormer{driverName: "sqlite", Engine: engine2}
	_ = engine2.Sync2(new(User))
	_, _ = engine2.Exec("INSERT INTO user (owner, name, email) VALUES ('org', 'a', 'X@x.com'), ('org', 'b', 'x@X.com')")
	err = b.ensureUserEmailUnique()
	t.Logf("startup with duplicates: %v", err)
	if err == nil {
		t.Fatal("expected error with duplicates")
	}
}
