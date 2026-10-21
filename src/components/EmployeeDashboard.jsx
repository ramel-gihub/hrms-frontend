import React from 'react';
import Chart from 'react-apexcharts';

export default function EmployeeDashboard({ currentUser, attendanceStatus, checkInTime, checkOutTime, handleCheckIn, handleCheckOut, chartOptions, chartSeries }) {
  const initials = currentUser?.email ? currentUser.email.slice(0, 2).toUpperCase() : 'US';

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <small className="text-muted text-uppercase fw-semibold">Employee Dashboard</small>
          <h3 className="fw-bold mb-1">Employee Dashboard</h3>
          <p className="text-muted mb-0">Monitor workforce activity, employee movements, requests and important HR events from one place.</p>
        </div>
        <div>
          <button className="btn btn-light shadow-sm"><i className="bi bi-calendar me-2"></i> Thursday, 24 September 2026</button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4 bg-primary text-white">
        <div className="card-body p-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
              {initials}
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Good afternoon, {currentUser?.email?.split('@')[0]} 👋</h5>
              <p className="mb-0 opacity-75">Here's your workspace overview for today. Stay productive and have a great day.</p>
              <div className="d-flex gap-2 mt-2">
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-person me-1"></i> FMP-000124</span>
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-briefcase me-1"></i> Senior Software Engineer</span>
                <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-diagram-3 me-1"></i> Engineering - Backend</span>
              </div>
            </div>
          </div>
          <div className="text-end">
            <h6 className="mb-1">Profile Completion 85%</h6>
            <div className="progress mt-2 mb-1" style={{ height: '6px', width: '200px' }}>
              <div className="progress-bar bg-warning" role="progressbar" style={{ width: '85%' }}></div>
            </div>
            <small className="opacity-75">complete your remaining profile details.</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Today's Overview */}
        <div className="col-12 col-xl-4">
           <div className="card border-0 shadow-sm h-100 bg-primary text-white">
              <div className="card-body p-4">
                  <div className="d-flex justify-content-between">
                    <small className="opacity-75 fw-bold">TODAY'S ATTENDANCE</small>
                    <span className="badge bg-white text-primary rounded-pill"><i className="bi bi-geo-alt me-1"></i> Guntur WFH</span>
                  </div>
                  <h3 className="fw-bold mt-2">You're {attendanceStatus.toLowerCase()}</h3>
                  
                  <div className="text-center py-4">
                    <div className="display-4 fw-bold">{checkInTime !== '--:--' ? checkInTime : '07:29'} <span className="fs-5">PM</span></div>
                    <div className="opacity-75 mt-1">Thursday - 24 September 2026</div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Working time</small>
                      <small className="fw-bold">08h 42m</small>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar bg-white" style={{ width: '70%' }}></div>
                    </div>
                    <div className="d-flex justify-content-between mt-1 opacity-75">
                      <small>09:00 AM</small>
                      <small>06:00 PM</small>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mb-4">
                    <button className="btn btn-light flex-fill text-primary fw-semibold" onClick={handleCheckIn} disabled={attendanceStatus === 'Checked In'}><i className="bi bi-box-arrow-in-right me-2"></i> Check In</button>
                    <button className="btn btn-outline-light flex-fill fw-semibold" onClick={handleCheckOut} disabled={attendanceStatus === 'Checked Out'}><i className="bi bi-box-arrow-right me-2"></i> Check Out</button>
                  </div>

                  <div className="d-flex justify-content-between text-center opacity-75">
                     <div>
                        <small className="d-block mb-1">Check In</small>
                        <div className="fw-bold">{checkInTime !== '--:--' ? checkInTime : '09:08 AM'}</div>
                     </div>
                     <div>
                        <small className="d-block mb-1">Check Out</small>
                        <div className="fw-bold">{checkOutTime !== '--:--' ? checkOutTime : '--:--'}</div>
                     </div>
                     <div>
                        <small className="d-block mb-1">Break</small>
                        <div className="fw-bold">45 min</div>
                     </div>
                  </div>
              </div>
           </div>
        </div>

        {/* My Workday */}
        <div className="col-12 col-xl-8">
           <div className="card border-0 shadow-sm h-100 bg-light border">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <small className="text-muted fw-bold">MY WORKDAY</small>
                    <h5 className="fw-bold mb-0">Today's summary</h5>
                  </div>
                  <select className="form-select form-select-sm w-auto shadow-sm">
                    <option>This Week</option>
                  </select>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded shadow-sm d-flex gap-3 align-items-center">
                      <div className="bg-primary-subtle text-primary p-2 rounded"><i className="bi bi-clock"></i></div>
                      <div>
                        <small className="text-muted d-block">Average Check-in</small>
                        <div className="fw-bold">9h 08m AM</div>
                        <small className="text-success"><i className="bi bi-arrow-up-right"></i> +12 min today</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded shadow-sm d-flex gap-3 align-items-center">
                      <div className="bg-primary-subtle text-primary p-2 rounded"><i className="bi bi-hourglass-split"></i></div>
                      <div>
                        <small className="text-muted d-block">Average Hours</small>
                        <div className="fw-bold">8h 12m</div>
                        <small className="text-muted">This Week</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded shadow-sm d-flex gap-3 align-items-center">
                      <div className="bg-success-subtle text-success p-2 rounded"><i className="bi bi-lightning-charge"></i></div>
                      <div>
                        <small className="text-muted d-block">On-Time / Late Arrivals</small>
                        <div className="fw-bold">18 On-Time - 3 Late</div>
                        <small className="text-muted">This Week</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded shadow-sm d-flex gap-3 align-items-center">
                      <div className="bg-warning-subtle text-warning p-2 rounded"><i className="bi bi-clipboard-data"></i></div>
                      <div>
                        <small className="text-muted d-block">Overtime & Attendance</small>
                        <div className="fw-bold">6h 30m OT - 96% Attendance</div>
                        <small className="text-muted">This Week</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-3">
                  <i className="bi bi-info-circle-fill fs-4 text-info"></i>
                  <div>
                    <strong>You're doing well!</strong>
                    <p className="mb-0">Your average working time this month is 8h 38m per day.</p>
                  </div>
                </div>

              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
