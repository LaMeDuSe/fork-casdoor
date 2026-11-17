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
	"context"
	"fmt"
	"strings"

	"github.com/casdoor/casdoor/i18n"
)

// Database-level guarantee that an email is used by at most one user per organization.
//
// xorm's Sync2 drops every index that is not declared on the struct, and cannot introspect
// expression indexes (MySQL reports a NULL column name and Sync2 fails). So instead of an
// expression index we use a generated column:
//
//	email_unique = NULLIF(LOWER(TRIM(email)), '')
//
// and declare UNIQUE(owner, email_unique) on the User struct, so xorm owns and keeps the index.
// Empty emails become NULL, and NULLs never collide in a unique index.
//
// Sync2 creates email_unique as a plain column; ensureUserEmailUnique converts it into a
// generated column once and recreates the index on it.

const (
	userEmailUniqueColumn    = "email_unique"
	userEmailUniqueIndexName = "owner_email_unique"
	userEmailUniqueExpr      = "NULLIF(LOWER(TRIM(email)), '')"
)

func (a *Ormer) ensureUserEmailUnique() error {
	switch a.driverName {
	case "mysql", "postgres", "sqlite":
	default:
		fmt.Printf("[email-unique] driver %s is not supported, email uniqueness is only enforced by the application\n", a.driverName)
		return nil
	}

	if err := a.normalizeStoredUserEmails(); err != nil {
		return err
	}

	duplicates, err := a.findDuplicateUserEmails()
	if err != nil {
		return err
	}
	if len(duplicates) > 0 {
		return fmt.Errorf("[email-unique] cannot enforce unique emails per organization, these emails are used by several users (owner/email: users): %s. Fix them, then restart Casdoor", strings.Join(duplicates, "; "))
	}

	generated, err := a.isUserEmailUniqueColumnGenerated()
	if err != nil {
		return err
	}
	if generated {
		return nil
	}

	return a.createUserEmailUniqueColumn()
}

// normalizeStoredUserEmails lowercases and trims every stored email
func (a *Ormer) normalizeStoredUserEmails() error {
	type userEmail struct {
		Owner string
		Name  string
		Email string
	}
	rows := []userEmail{}
	err := a.Engine.Table(new(User)).Cols("owner", "name", "email").Where("email <> ''").Find(&rows)
	if err != nil {
		return err
	}

	count := 0
	for _, row := range rows {
		normalized := NormalizeEmail(row.Email)
		if normalized == row.Email {
			continue
		}

		_, err = a.Engine.Table(new(User)).Where("owner = ? AND name = ?", row.Owner, row.Name).Update(map[string]interface{}{"email": normalized})
		if err != nil {
			return err
		}
		count++
	}

	if count > 0 {
		fmt.Printf("[email-unique] normalized %d user emails to lowercase\n", count)
	}
	return nil
}

func (a *Ormer) findDuplicateUserEmails() ([]string, error) {
	type duplicate struct {
		Owner string
		Email string
		Users string
	}

	aggregate := "GROUP_CONCAT(name SEPARATOR ', ')"
	if a.driverName == "postgres" {
		aggregate = "STRING_AGG(name, ', ')"
	} else if a.driverName == "sqlite" {
		aggregate = "GROUP_CONCAT(name, ', ')"
	}

	query := fmt.Sprintf("SELECT owner, LOWER(TRIM(email)) AS email, %s AS users FROM %s WHERE TRIM(email) <> '' GROUP BY owner, LOWER(TRIM(email)) HAVING COUNT(*) > 1",
		aggregate, a.Engine.Quote(a.Engine.TableName(new(User), true)))

	rows := []duplicate{}
	if err := a.Engine.SQL(query).Find(&rows); err != nil {
		return nil, err
	}

	res := []string{}
	for _, row := range rows {
		res = append(res, fmt.Sprintf("%s/%s: %s", row.Owner, row.Email, row.Users))
	}
	return res, nil
}

func (a *Ormer) isUserEmailUniqueColumnGenerated() (bool, error) {
	tableName := a.Engine.TableName(new(User))

	var query string
	switch a.driverName {
	case "mysql":
		query = "SELECT EXTRA AS value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
	case "postgres":
		query = "SELECT is_generated AS value FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?"
	case "sqlite":
		// hidden: 2 = virtual generated column, 3 = stored generated column
		query = "SELECT CAST(hidden AS TEXT) AS value FROM pragma_table_xinfo(?) WHERE name = ?"
	}

	results, err := a.Engine.QueryString(query, tableName, userEmailUniqueColumn)
	if err != nil {
		return false, err
	}
	if len(results) == 0 {
		return false, nil
	}

	value := strings.ToUpper(results[0]["value"])
	switch a.driverName {
	case "mysql":
		return strings.Contains(value, "GENERATED"), nil
	case "postgres":
		return value == "ALWAYS", nil
	default:
		return value == "2" || value == "3", nil
	}
}

// createUserEmailUniqueColumn replaces the plain email_unique column created by Sync2 with a generated one
// and recreates the unique index under the name xorm expects, so later Sync2 runs keep it.
func (a *Ormer) createUserEmailUniqueColumn() error {
	tableName := a.Engine.TableName(new(User))
	quotedTable := a.Engine.Quote(a.Engine.TableName(new(User), true))
	quotedColumn := a.Engine.Quote(userEmailUniqueColumn)
	indexName := fmt.Sprintf("UQE_%s_%s", tableName, userEmailUniqueIndexName)
	quotedIndex := a.Engine.Quote(indexName)

	var dropIndex, addColumn string
	switch a.driverName {
	case "mysql":
		dropIndex = fmt.Sprintf("DROP INDEX %s ON %s", quotedIndex, quotedTable)
		addColumn = fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s VARCHAR(100) GENERATED ALWAYS AS (%s) STORED", quotedTable, quotedColumn, userEmailUniqueExpr)
	case "postgres":
		dropIndex = fmt.Sprintf("DROP INDEX IF EXISTS %s", quotedIndex)
		addColumn = fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s VARCHAR(100) GENERATED ALWAYS AS (%s) STORED", quotedTable, quotedColumn, userEmailUniqueExpr)
	case "sqlite":
		dropIndex = fmt.Sprintf("DROP INDEX IF EXISTS %s", quotedIndex)
		addColumn = fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s VARCHAR(100) GENERATED ALWAYS AS (%s) VIRTUAL", quotedTable, quotedColumn, userEmailUniqueExpr)
	}

	exists, err := a.Engine.IsTableExist(new(User))
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("[email-unique] table %s does not exist", tableName)
	}

	// The index may not exist (e.g. MySQL has no DROP INDEX IF EXISTS), so ignore errors here
	if _, err = a.Engine.Exec(dropIndex); err != nil {
		fmt.Printf("[email-unique] drop index %s: %s (ignored)\n", indexName, err.Error())
	}

	hasColumn, err := a.Engine.Dialect().IsColumnExist(a.Engine.DB(), context.Background(), tableName, userEmailUniqueColumn)
	if err != nil {
		return err
	}
	if hasColumn {
		if _, err = a.Engine.Exec(fmt.Sprintf("ALTER TABLE %s DROP COLUMN %s", quotedTable, quotedColumn)); err != nil {
			return err
		}
	}

	if _, err = a.Engine.Exec(addColumn); err != nil {
		return err
	}

	if _, err = a.Engine.Exec(fmt.Sprintf("CREATE UNIQUE INDEX %s ON %s (%s, %s)", quotedIndex, quotedTable, a.Engine.Quote("owner"), quotedColumn)); err != nil {
		return err
	}

	fmt.Printf("[email-unique] created generated column %s and unique index %s\n", userEmailUniqueColumn, indexName)
	return nil
}

// isUserEmailUniqueViolation reports whether err comes from the (owner, email_unique) unique index.
// MySQL and Postgres errors name the index (UQE_user_owner_email_unique), SQLite names the columns (user.email_unique).
func isUserEmailUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), userEmailUniqueColumn)
}

// wrapUserEmailUniqueError turns a database unique violation on the email index into the user-facing message
func wrapUserEmailUniqueError(err error, lang string) error {
	if isUserEmailUniqueViolation(err) {
		return fmt.Errorf(i18n.Translate(lang, "check:Email already exists"))
	}
	return err
}
