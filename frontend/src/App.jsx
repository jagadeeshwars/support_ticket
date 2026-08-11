import { useState, useEffect } from 'react';
import { Ticket, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      if (response.ok) {
        setNewTicket({ title: '', description: '' });
        fetchTickets(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${id}/resolve`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchTickets(); // Refresh the list
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <Ticket className="logo-icon" size={32} />
          <h1>IT Support Portal</h1>
        </div>
        <p className="subtitle">Submit and track your support requests</p>
      </header>

      <main className="main-content">
        <section className="submit-section">
          <div className="glass-card form-card">
            <h2>New Support Ticket</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label htmlFor="title">Issue Summary</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g., Cannot connect to VPN"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="description">Detailed Description</label>
                <textarea
                  id="description"
                  placeholder="Please describe the issue in detail..."
                  rows="4"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  disabled={submitting}
                  required
                ></textarea>
              </div>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </section>

        <section className="tickets-section">
          <div className="glass-card tickets-card">
            <div className="card-header">
              <h2>Recent Tickets</h2>
              <span className="badge">{tickets.length} total</span>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} className="empty-icon" />
                <p>No active support tickets! Everything is running smoothly.</p>
              </div>
            ) : (
              <ul className="ticket-list">
                {tickets.map(ticket => (
                  <li key={ticket.id} className={`ticket-item ${ticket.status}`}>
                    <div className="ticket-info">
                      <div className="ticket-title-row">
                        <span className={`status-icon ${ticket.status}`}>
                          {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        </span>
                        <h3>{ticket.title}</h3>
                        <span className={`status-badge ${ticket.status}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="ticket-desc">{ticket.description}</p>
                      <div className="ticket-meta">
                        <Clock size={14} />
                        <span>{new Date(ticket.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {ticket.status === 'open' && (
                      <button 
                        className="resolve-btn"
                        onClick={() => handleResolve(ticket.id)}
                        title="Mark as Resolved"
                      >
                        <CheckCircle size={20} />
                        <span>Resolve</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
