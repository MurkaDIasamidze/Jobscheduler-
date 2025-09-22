import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [jobName, setJobName] = useState('')
  const [command, setCommand] = useState('')
  const [scheduleText, setScheduleText] = useState(
    '{ "times": [{ "hour": 8, "minute": 0 }], "weekdays": [1], "months": [10], "years": [2025] }'
  )

  useEffect(() => {
    if (token) fetchJobs()
  }, [token])

  async function login() {
    try {
      const res = await axios.post(API + '/login', { email, password })
      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      setEmail('')
      setPassword('')
    } catch (e: any) {
      alert('Login failed: ' + (e.response?.data?.message || e.message))
    }
  }

  async function register() {
    try {
      await axios.post(API + '/register', { email, password, name })
      alert('Registered successfully! Now login.')
      setEmail('')
      setPassword('')
      setName('')
    } catch (e: any) {
      alert('Registration failed: ' + (e.response?.data?.message || e.message))
    }
  }

  async function fetchJobs() {
    try {
      const res = await axios.get(API + '/jobs', {
        headers: { Authorization: 'Bearer ' + token },
      })
      setJobs(res.data)
    } catch (e: any) {
      alert('Failed to fetch jobs: ' + (e.response?.data?.message || e.message))
    }
  }

  async function createJob() {
    try {
      const schedule = JSON.parse(scheduleText)
      const res = await axios.post(
        API + '/create_job',
        { name: jobName, command, schedule },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      setJobs([res.data, ...jobs])
      setJobName('')
      setCommand('')
    } catch (e: any) {
      alert('Error creating job: ' + (e.response?.data?.message || e.message))
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setJobs([])
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Scheduler</h1>

      {!token ? (
        <div className="card p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Login / Register</h2>
          <input
            className="input border p-2 mb-2 w-full"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="input border p-2 mb-2 w-full"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            className="input border p-2 mb-2 w-full"
            placeholder="Name (for register)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="button bg-blue-500 text-white p-2 rounded" onClick={login}>
              Login
            </button>
            <button className="button bg-green-500 text-white p-2 rounded" onClick={register}>
              Register
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card p-4 border rounded shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">Create Job</h2>
            <input
              className="input border p-2 mb-2 w-full"
              placeholder="Job Name"
              value={jobName}
              onChange={e => setJobName(e.target.value)}
            />
            <input
              className="input border p-2 mb-2 w-full"
              placeholder="Command"
              value={command}
              onChange={e => setCommand(e.target.value)}
            />
            <textarea
              className="input border p-2 mb-2 w-full"
              rows={4}
              value={scheduleText}
              onChange={e => setScheduleText(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="button bg-blue-500 text-white p-2 rounded" onClick={createJob}>
                Create Job
              </button>
              <button className="button bg-red-500 text-white p-2 rounded" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          <div className="card p-4 border rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Jobs</h2>
            {jobs.length === 0 ? (
              <div>No jobs yet</div>
            ) : (
              <ul>
                {jobs.map(job => (
                  <li key={job.id} className="border-b border-gray-300 py-2">
                    <div className="font-semibold">{job.name}</div>
                    <div className="text-sm text-gray-500">{job.command}</div>
                    <pre className="text-xs">{JSON.stringify(job.schedule, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App
