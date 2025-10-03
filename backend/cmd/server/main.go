package main

import (
    "encoding/json"
    "log"
    "net/http"

    "github.com/gorilla/mux"
    "github.com/rs/cors"
    "github.com/google/uuid"
)

type User struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email"`
    Password string `json:"-"`
    Role     string `json:"role"` // "user" or "admin"
}

type Job struct {
    ID       string      `json:"id"`
    Name     string      `json:"name"`
    Command  string      `json:"command"`
    Schedule interface{} `json:"schedule"`
    Enabled  bool        `json:"enabled"`
}

type Execution struct {
    ID        string `json:"id"`
    Job       Job    `json:"job"`
    Success   bool   `json:"success"`
    Output    string `json:"output"`
    CreatedAt string `json:"createdAt"`
}

var users = map[string]User{}
var jobs = map[string]Job{}
var executions = []Execution{}

func main() {
    r := mux.NewRouter()

    // Auth routes
    r.HandleFunc("/api/auth/register", registerHandler).Methods("POST")
    r.HandleFunc("/api/auth/login", loginHandler).Methods("POST")

    // Jobs
    r.HandleFunc("/api/jobs", getJobs).Methods("GET")
    r.HandleFunc("/api/jobs", createJob).Methods("POST")
    r.HandleFunc("/api/jobs/update", updateJob).Methods("PUT")
    r.HandleFunc("/api/jobs/delete", deleteJob).Methods("DELETE")

    // Executions
    r.HandleFunc("/api/executions", getExecutions).Methods("GET")

    // Users
    r.HandleFunc("/api/users", getUsers).Methods("GET")
    r.HandleFunc("/api/users", updateUserRole).Methods("PUT")

    // Enable CORS
    handler := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:3000"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }).Handler(r)

    log.Println("Server running on :3001")
    log.Fatal(http.ListenAndServe(":3001", handler))
}

// ---- Handlers ----

func registerHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Name     string `json:"name"`
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    // Simple check
    for _, u := range users {
        if u.Email == req.Email {
            http.Error(w, "Email already exists", http.StatusBadRequest)
            return
        }
    }

    id := uuid.New().String()
    user := User{
        ID:       id,
        Name:     req.Name,
        Email:    req.Email,
        Password: req.Password,
        Role:     "user",
    }
    users[id] = user
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    for _, u := range users {
        if u.Email == req.Email && u.Password == req.Password {
            token := u.ID // for demo, token = user ID
            json.NewEncoder(w).Encode(map[string]string{"token": token})
            return
        }
    }
    http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "No token", http.StatusUnauthorized)
            return
        }
        // remove "Bearer "
        token = token[len("Bearer "):]
        if _, ok := users[token]; !ok {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

// Jobs
func getJobs(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        arr := []Job{}
        for _, j := range jobs {
            arr = append(arr, j)
        }
        json.NewEncoder(w).Encode(arr)
    })(w, r)
}

func createJob(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        var job Job
        json.NewDecoder(r.Body).Decode(&job)
        job.ID = uuid.New().String()
        jobs[job.ID] = job
        json.NewEncoder(w).Encode(job)
    })(w, r)
}

func updateJob(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            ID      string `json:"id"`
            Enabled bool   `json:"enabled"`
        }
        json.NewDecoder(r.Body).Decode(&req)
        job := jobs[req.ID]
        job.Enabled = req.Enabled
        jobs[req.ID] = job
        json.NewEncoder(w).Encode(job)
    })(w, r)
}

func deleteJob(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            ID string `json:"id"`
        }
        json.NewDecoder(r.Body).Decode(&req)
        delete(jobs, req.ID)
        w.WriteHeader(http.StatusNoContent)
    })(w, r)
}

// Executions
func getExecutions(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(executions)
    })(w, r)
}

// Users
func getUsers(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        arr := []User{}
        for _, u := range users {
            arr = append(arr, u)
        }
        json.NewEncoder(w).Encode(arr)
    })(w, r)
}

func updateUserRole(w http.ResponseWriter, r *http.Request) {
    authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            ID   string `json:"id"`
            Role string `json:"role"`
        }
        json.NewDecoder(r.Body).Decode(&req)
        user := users[req.ID]
        user.Role = req.Role
        users[req.ID] = user
        json.NewEncoder(w).Encode(user)
    })(w, r)
}
