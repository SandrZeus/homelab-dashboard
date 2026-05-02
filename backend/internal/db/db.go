package db

import (
	"context"
	"embed"
	"fmt"

	migrate "github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

//go:embed migrations/*.sql
var migrations embed.FS

func Init(ctx context.Context, url string) (*pgxpool.Pool, error) {
	db, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

func Migrate(pool *pgxpool.Pool) error {
	src, err := iofs.New(migrations, "migrations")
	if err != nil {
		return fmt.Errorf("failed to create a migration source: %w", err)
	}

	db := stdlib.OpenDBFromPool(pool)

	dv, err := pgxmigrate.WithInstance(db, &pgxmigrate.Config{})
	if err != nil {
		return fmt.Errorf("could not create a pgx driver: %w", err)
	}

	mg, err := migrate.NewWithInstance("iofs", src, "postgres", dv)
	if err != nil {
		return fmt.Errorf("migration error: %w", err)
	}

	defer mg.Close()
	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}
