import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { touchBaseEvent } from '../eventData';

const MainPage = () => {
  const [eventCode, setEventCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    // For demo purposes, only accept the specific event code
    if (eventCode.trim() === touchBaseEvent.eventCode) {
      navigate(`/mint/${eventCode.trim()}`);
    } else {
      setError('Invalid event code. Please check and try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <img 
              src="/Base_square_blue.svg" 
              alt="Base Logo" 
              style={{ 
                width: '48px', 
                height: '48px',
                margin: '0 auto'
              }} 
            />
          </div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Base Events
          </h1>
          <p style={{ color: '#6b7280' }}>
            Enter your event code to mint your attendance NFT
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="eventCode" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Event Code
            </label>
            <input
              type="text"
              id="eventCode"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              placeholder="Enter event code (e.g., B56-A64)"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            {error && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!eventCode.trim()}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              border: '2px solid',
              transition: 'all 0.1s ease',
              fontSize: '1rem',
              cursor: eventCode.trim() ? 'pointer' : 'not-allowed',
              color: eventCode.trim() ? 'black' : '#3b82f6',
              borderColor: eventCode.trim() ? 'black' : '#93c5fd',
              backgroundColor: eventCode.trim() ? '#60a5fa' : 'transparent',
              boxShadow: eventCode.trim() ? '0 4px 0 0 rgba(0,0,0,1)' : 'none'
            }}
            onMouseOver={(e) => {
              if (eventCode.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0,0,0,1)';
              }
            }}
            onMouseOut={(e) => {
              if (eventCode.trim()) {
                e.currentTarget.style.backgroundColor = '#60a5fa';
                e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
              }
            }}
            onMouseDown={(e) => {
              if (eventCode.trim()) {
                e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0,0,0,1)';
                e.currentTarget.style.transform = 'translateY(2px)';
              }
            }}
            onMouseUp={(e) => {
              if (eventCode.trim()) {
                e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Continue to Mint
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          <h3 style={{
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Available Event:
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            <p><strong>Code:</strong> {touchBaseEvent.eventCode}</p>
            <p><strong>Event:</strong> {touchBaseEvent.eventName}</p>
            <p><strong>Date:</strong> {touchBaseEvent.date}</p>
            <p><strong>Time:</strong> {touchBaseEvent.time}</p>
            <p><strong>Location:</strong> {touchBaseEvent.location}</p>
          </div>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.5rem',
            border: '1px solid #f59e0b'
          }}>
            <p style={{
              color: '#92400e',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              ⚠️ Event Not Registered
            </p>
            <p style={{
              color: '#92400e',
              fontSize: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              This event needs to be registered on the blockchain before users can mint NFTs.
            </p>
            <button
              onClick={() => navigate('/create-event')}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b';
              }}
            >
              Register Event on Blockchain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
