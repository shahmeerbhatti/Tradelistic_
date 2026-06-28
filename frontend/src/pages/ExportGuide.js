import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExporterHeader from '../components/ExporterHeader';
import { getExportGuide, getExportGuideCountries, getExportGuideReadiness } from '../services/api';
import '../styles/ExportGuide.css';

const statusMeta = {
  available: { label: 'Available', icon: 'fa-circle-check' },
  missing: { label: 'Missing', icon: 'fa-circle-exclamation' },
  required_if_applicable: { label: 'Required if applicable', icon: 'fa-triangle-exclamation' },
};

const normalizeItem = (item, defaultStatus) => {
  if (typeof item === 'string') {
    return { label: item, status: defaultStatus, description: '' };
  }
  return item || { label: 'Requirement', status: defaultStatus, description: '' };
};

const StatusBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.required_if_applicable;
  return (
    <span className={`guide-status-badge is-${status || 'required_if_applicable'}`}>
      <i className={`fas ${meta.icon}`}></i>
      {meta.label}
    </span>
  );
};

const GuideList = ({ items, defaultStatus = 'required_if_applicable' }) => (
  <div className="guide-list">
    {(items || []).map((rawItem, index) => {
      const item = normalizeItem(rawItem, defaultStatus);
      return (
        <article key={`${item.label}-${index}`} className="guide-list-item">
          <div>
            <strong>{item.label}</strong>
            {item.description && <p>{item.description}</p>}
          </div>
          <StatusBadge status={item.status || defaultStatus} />
        </article>
      );
    })}
  </div>
);

const ExportGuide = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [guide, setGuide] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    document.title = 'Exporter Guide - Tradelistic';
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('user_type');
    if (!token || userType !== 'exporter') {
      navigate('/login', { replace: true });
      return undefined;
    }

    const loadCountries = async () => {
      try {
        const response = await getExportGuideCountries();
        const availableCountries = response.data.countries || [];
        setCountries(availableCountries);
        setSelectedCountry(availableCountries[0]?.exporterCountryCode || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Exporter guide countries could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedCountry) return;

    const loadGuide = async () => {
      setGuideLoading(true);
      setError('');
      setUnavailable(false);
      try {
        const [guideResponse, readinessResponse] = await Promise.all([
          getExportGuide(selectedCountry),
          getExportGuideReadiness(selectedCountry),
        ]);

        if (guideResponse.data.status !== 'available') {
          setGuide(null);
          setUnavailable(true);
        } else {
          setGuide(guideResponse.data);
        }
        setReadiness(readinessResponse.data || null);
      } catch (err) {
        setGuide(null);
        setReadiness(null);
        setError(err.response?.data?.error || 'Exporter guide could not be loaded.');
      } finally {
        setGuideLoading(false);
      }
    };

    loadGuide();
  }, [selectedCountry]);

  const selectedCountryName = useMemo(() => {
    return countries.find((item) => item.exporterCountryCode === selectedCountry)?.exporterCountryName || selectedCountry;
  }, [countries, selectedCountry]);

  const warnings = [...(guide?.warnings || []), ...(readiness?.warnings || [])];

  if (loading) {
    return (
      <div className="exporter-shell">
        <ExporterHeader currentPage="Exporter Guide" />
        <div className="export-guide-loader">
          <i className="fas fa-spinner fa-spin"></i>
          Loading exporter guide
        </div>
      </div>
    );
  }

  return (
    <div className="exporter-shell">
      <ExporterHeader currentPage="Exporter Guide" />
      <main className="export-guide-page">
        <section className="export-guide-hero">
          <div>
            <span className="dashboard-kicker">Exporter compliance</span>
            <h1>Exporter Compliance Guide</h1>
            <p>Select the country your company exports from to view exporter-side registrations, documents, and filing guidance.</p>
          </div>
          <div className="country-select-card">
            <label htmlFor="country-select">Exporter Country</label>
            <select id="country-select" value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
              {countries.map((country) => (
                <option key={country.exporterCountryCode} value={country.exporterCountryCode}>
                  {country.exporterCountryName}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="dashboard-alert">
            <i className="fas fa-circle-info"></i>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {guideLoading && (
          <div className="export-guide-loader compact">
            <i className="fas fa-spinner fa-spin"></i>
            Loading {selectedCountryName}
          </div>
        )}

        {!guideLoading && unavailable && (
          <section className="guide-card unavailable-card">
            <i className="fas fa-circle-info"></i>
            <h2>Information unavailable</h2>
            <p>Exporter guidance for the selected country is not available yet.</p>
          </section>
        )}

        {!guideLoading && guide && (
          <>
            <section className="guide-card country-guide-card">
              <div className="guide-card-head">
                <div>
                  <span className="dashboard-kicker">{guide.exporterCountryName}</span>
                  <h2>Country Overview</h2>
                </div>
                <StatusBadge status="available" />
              </div>
              <p>{guide.overview}</p>
            </section>

            <section className="export-guide-grid">
              <div className="guide-card">
                <div className="guide-card-head">
                  <h2>Standard Export Documents</h2>
                </div>
                <GuideList items={guide.standardExportDocuments} />
              </div>

              <div className="guide-card">
                <div className="guide-card-head">
                  <h2>Government Registrations</h2>
                </div>
                <GuideList items={guide.governmentRegistrations} />
              </div>
            </section>

            <section className="export-guide-grid">
              <div className="guide-card">
                <div className="guide-card-head">
                  <h2>Export Licences & Permits</h2>
                </div>
                <GuideList items={guide.exportLicencesPermits} />
              </div>

              <div className="guide-card">
                <div className="guide-card-head">
                  <h2>Export Declaration Process</h2>
                </div>
                <GuideList items={guide.exportDeclarationProcess} />
              </div>
            </section>

            <section className="guide-card readiness-card">
              <div className="guide-card-head">
                <div>
                  <span className="dashboard-kicker">{readiness?.exporterCountryCode || guide.exporterCountryCode}</span>
                  <h2>Your Company Readiness</h2>
                </div>
              </div>

              <div className="readiness-summary">
                <article>
                  <span>Available</span>
                  <strong>{readiness?.completedChecks?.length || 0}</strong>
                </article>
                <article>
                  <span>Missing</span>
                  <strong>{readiness?.missingChecks?.length || 0}</strong>
                </article>
                <article>
                  <span>Conditional</span>
                  <strong>{readiness?.conditionalChecks?.length || 0}</strong>
                </article>
              </div>

              <h3>Completed checks</h3>
              <GuideList items={readiness?.completedChecks || []} defaultStatus="available" />

              <h3>Missing Company Documents</h3>
              <GuideList items={readiness?.missingChecks || []} defaultStatus="missing" />

              <h3>Conditional requirements</h3>
              <GuideList items={readiness?.conditionalChecks || []} defaultStatus="required_if_applicable" />
            </section>

            {warnings.length > 0 && (
              <section className="guide-card warning-card">
                <div className="guide-card-head">
                  <h2>Warnings / Notes</h2>
                </div>
                <GuideList
                  items={warnings.map((item) => ({
                    label: item,
                    status: 'required_if_applicable',
                  }))}
                />
              </section>
            )}

            <section className="guide-card sources-card">
              <div className="guide-card-head">
                <h2>Official Sources</h2>
              </div>
              <div className="source-list">
                {(guide.officialSources || []).map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-arrow-up-right-from-square"></i>
                    {source.label}
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ExportGuide;
