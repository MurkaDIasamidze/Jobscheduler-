package handlers

import (
    "encoding/json"
    "net/http"
    "strconv"
    "time"

    "github.com/gorilla/mux"
    "github.com/yourusername/jobscheduler-go/internal/db"
    "github.com/yourusername/jobscheduler-go/internal/models"
    "github.com/yourusername/jobscheduler-go/internal/scheduler"
    "gorm.io/gorm"
)

type Handler struct {
    DB        *db.DB
    Scheduler *scheduler.Scheduler
}

// helper response
func jsonResp(w http.ResponseWriter, v interface{}, code int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    _ = json.NewEncoder(w).Encode(v)
}

// list jobs
func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
    var jobs []models.Job
    if err := h.DB.GORM.Find(&jobs).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    jsonResp(w, jobs, http.StatusOK)
}

// create job
func (h *Handler) CreateJob(w http.ResponseWriter, r *http.Request) {
    var j models.Job
    if err := json.NewDecoder(r.Body).Decode(&j); err != nil {
        jsonResp(w, map[string]string{"error": "invalid body"}, http.StatusBadRequest)
        return
    }
    j.CreatedAt = time.Now()
    j.UpdatedAt = time.Now()
    if err := h.DB.GORM.Create(&j).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }

    // schedule immediately if enabled
    if j.Enabled {
        _ = h.Scheduler.ScheduleJob(&j)
    }

    jsonResp(w, j, http.StatusCreated)
}

// get job
func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)
    var j models.Job
    if err := h.DB.GORM.First(&j, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            jsonResp(w, map[string]string{"error": "not found"}, http.StatusNotFound)
            return
        }
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    jsonResp(w, j, http.StatusOK)
}

// update job
func (h *Handler) UpdateJob(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)
    var j models.Job
    if err := h.DB.GORM.First(&j, id).Error; err != nil {
        jsonResp(w, map[string]string{"error": "not found"}, http.StatusNotFound)
        return
    }

    var in models.Job
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        jsonResp(w, map[string]string{"error": "invalid body"}, http.StatusBadRequest)
        return
    }

    j.Name = in.Name
    j.Schedule = in.Schedule
    j.Command = in.Command
    j.Enabled = in.Enabled
    j.UpdatedAt = time.Now()

    if err := h.DB.GORM.Save(&j).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }

    // reschedule
    _ = h.Scheduler.RescheduleJob(&j)

    jsonResp(w, j, http.StatusOK)
}

// delete job
func (h *Handler) DeleteJob(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)
    if err := h.DB.GORM.Delete(&models.Job{}, id).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    // also remove from scheduler
    h.Scheduler.Remove(int64(id))
    w.WriteHeader(http.StatusNoContent)
}

// toggle enabled
func (h *Handler) ToggleJob(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)
    var j models.Job
    if err := h.DB.GORM.First(&j, id).Error; err != nil {
        jsonResp(w, map[string]string{"error": "not found"}, http.StatusNotFound)
        return
    }
    j.Enabled = !j.Enabled
    j.UpdatedAt = time.Now()
    if err := h.DB.GORM.Save(&j).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    if j.Enabled {
        _ = h.Scheduler.ScheduleJob(&j)
    } else {
        h.Scheduler.Remove(int64(j.ID))
    }
    jsonResp(w, j, http.StatusOK)
}

// run job immediately
func (h *Handler) RunJobNow(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)
    var j models.Job
    if err := h.DB.GORM.First(&j, id).Error; err != nil {
        jsonResp(w, map[string]string{"error": "not found"}, http.StatusNotFound)
        return
    }
    exec, err := h.Scheduler.RunJobNow(&j)
    if err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    jsonResp(w, exec, http.StatusOK)
}

// list executions
func (h *Handler) ListExecutions(w http.ResponseWriter, r *http.Request) {
    var exs []models.Execution
    if err := h.DB.GORM.Order("started_at desc").Limit(200).Find(&exs).Error; err != nil {
        jsonResp(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
        return
    }
    jsonResp(w, exs, http.StatusOK)
}
