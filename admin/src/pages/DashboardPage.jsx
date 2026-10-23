import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [catchData, setCatchData] = useState(null);
  const [sosData, setSosData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchWeather = api.get('/weather', { params: { lat: 13.0827, lon: 80.2707 } })
        .then(res => res.data?.data)
        .catch(() => null);

      const [ov, cd, sd, wt] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/catches', { params: { year: new Date().getFullYear() } }),
        api.get('/analytics/sos'),
        fetchWeather,
      ]);

      setOverview(ov.data?.data || null);
      setCatchData(cd.data?.data || null);
      setSosData(sd.data?.data || null);
      setWeather(wt);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load analytics data from server. Please verify backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" />
        <span className={styles.loadingText}>Loading Ocean Connect analytics...</span>
      </div>
    );
  }

  const monthlyData = MONTHS.map((m, i) => {
    const found = catchData?.monthlyStats?.find(s => s._id?.month === i + 1);
    return { month: m, earnings: found?.totalEarnings || 0, catches: found?.catchCount || 0 };
  });

  const stats = [
    { label: 'Fishermen', value: overview?.fishermen?.total || 0, icon: '🎣', color: '#0066cc', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Officers', value: overview?.officers?.total || 0, icon: '🎖️', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Active Boats', value: overview?.boats?.total || 0, icon: '⛵', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'Total Catches', value: overview?.catches?.total || 0, icon: '🐟', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'SOS Pending', value: overview?.sos?.pending || 0, icon: '🆘', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Open Complaints', value: overview?.complaints?.open || 0, icon: '📋', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Dashboard Overview</h2>
          <p className={styles.subtitle}>Ocean Connect – Marine & Fisheries Management Platform</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadData}>↻ Refresh Stats</button>
      </div>

      {error && (
        <div className="alert-banner alert-error" style={{ marginBottom: 20 }}>
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={loadData} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* Weather Strip */}
      {weather && (
        <div className={styles.weatherStrip}>
          <div className={styles.weatherItem}>
            <span className={styles.weatherIcon}>🌦️</span>
            <div>
              <div className={styles.weatherLabel}>Coastal Weather</div>
              <div className={styles.weatherVal}>
                {Math.round(weather.temperature ?? weather.temp ?? 28)}°C · {weather.condition || 'Clear Sky'}
              </div>
            </div>
          </div>
          <div className={styles.weatherDivider} />
          <div className={styles.weatherItem}>
            <span className={styles.weatherIcon}>💨</span>
            <div>
              <div className={styles.weatherLabel}>Wind Speed</div>
              <div className={styles.weatherVal}>{weather.windSpeed ?? weather.wind_speed ?? 5.2} km/h</div>
            </div>
          </div>
          <div className={styles.weatherDivider} />
          <div className={styles.weatherItem}>
            <span className={styles.weatherIcon}>💧</span>
            <div>
              <div className={styles.weatherLabel}>Humidity</div>
              <div className={styles.weatherVal}>{weather.humidity ?? 78}%</div>
            </div>
          </div>
          <div className={styles.weatherDivider} />
          <div className={styles.weatherItem}>
            <span className={styles.weatherIcon}>👁️</span>
            <div>
              <div className={styles.weatherLabel}>Visibility</div>
              <div className={styles.weatherVal}>{(weather.visibility ?? 10000) / 1000} km</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard} style={{ borderColor: s.border }}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className={styles.statValue} style={{ color: s.color }}>
              {s.value.toLocaleString()}
            </div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Monthly Earnings */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Monthly Catch Revenue ({new Date().getFullYear()})</h3>
            <span className={styles.chartBadge}>₹ In Rupees</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ left: -10, top: 10, bottom: 0, right: 10 }}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={v => [`₹${v.toLocaleString()}`, 'Earnings']}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  color: '#0f172a',
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#0066cc' : '#0284c7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Catches Line */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Monthly Catch Activity Count</h3>
            <span className={styles.chartBadge}>Reports</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ left: -10, top: 10, bottom: 0, right: 10 }}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => [v, 'Catches']}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  color: '#0f172a',
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="catches"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#059669' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SOS Status + Top Species */}
      <div className={styles.bottomRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>🆘 Emergency Distribution by Type</h3>
          {sosData?.byType?.length ? (
            <div className={styles.barList}>
              {sosData.byType.map(s => (
                <div key={s._id || 'other'} className={styles.barItem}>
                  <span className={styles.barLabel}>{s._id || 'Other'}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.min((s.count / Math.max(...sosData.byType.map(x => x.count), 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No emergency SOS records logged.</p>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>🐟 Top Species Volume Recorded</h3>
          {catchData?.topSpecies?.length ? (
            <div className={styles.speciesList}>
              {catchData.topSpecies.slice(0, 7).map((s, i) => (
                <div key={s._id || i} className={styles.speciesItem}>
                  <span className={styles.speciesRank}>#{i + 1}</span>
                  <span className={styles.speciesName}>{s._id}</span>
                  <span className={styles.speciesWeight}>{(s.totalWeight || 0).toLocaleString()} kg</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No species catch data logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
