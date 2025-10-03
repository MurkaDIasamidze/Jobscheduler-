package router

import (
    "net/http"

    "github.com/gorilla/mux"
    "github.com/rs/cors"

    "github.com/yourusername/jobscheduler-go/internal/db"
    "github.com/yourusername/jobscheduler-go/internal/handlers"
    "github.com/yourusername/jobscheduler-go/internal/scheduler"
)

func New(d *db.DB, sched *scheduler.Scheduler) http.Handler {
    h := &handlers.Handler{DB: d, Scheduler: sched}
    r := mux.NewRouter()

    api := r.PathPrefix("/api").Subrouter()

    api.HandleFunc("/jobs", h.ListJobs).Methods("GET")
    api.HandleFunc("/jobs", h.CreateJob).Methods("POST")
    api.HandleFunc("/jobs/{id:[0-9]+}", h.GetJob).Methods("GET")
    api.HandleFunc("/jobs/{id:[0-9]+}", h.UpdateJob).Methods("PUT")
    api.HandleFunc("/jobs/{id:[0-9]+}", h.DeleteJob).Methods("DELETE")
    api.HandleFunc("/jobs/{id:[0-9]+}/toggle", h.ToggleJob).Methods("POST")
    api.HandleFunc("/jobs/{id:[0-9]+}/run", h.RunJobNow).Methods("POST")

    api.HandleFunc("/executions", h.ListExecutions).Methods("GET")

    // health
    r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("ok"))
    }).Methods("GET")

    // enable CORS
    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:3000"}, // разрешаем фронтенд
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    })

    return c.Handler(r)
}
