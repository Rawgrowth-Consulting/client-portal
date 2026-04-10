'use client';

import { useState } from 'react';
import { SOPNode, STAGE_COLORS } from './sop-data';

interface Props {
  sop: SOPNode | null;
  onClose: () => void;
}

export default function SOPDrawer({ sop, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'steps' | 'scripts' | 'metrics'>('steps');

  if (!sop) return null;

  const colors = STAGE_COLORS[sop.stage];

  return (
    <div
      style={{
        width: 440,
        background: '#0a0f1e',
        borderLeft: `1px solid #1e293b`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#0f172a',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                color: colors.badge, background: `${colors.badge}18`,
                padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
              }}>
                {sop.stage}
              </span>
              {sop.sop.bottleneckFlag && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  color: '#f59e0b', background: '#f59e0b18',
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  ⚠ BOTTLENECK RISK
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.3 }}>
              {sop.sop.title}
            </h2>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Owner:</span>{' '}
                <span style={{ color: '#94a3b8' }}>{sop.sop.owner}</span>
              </div>
              {sop.sop.timeframe && (
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Time:</span>{' '}
                  <span style={{ color: '#94a3b8' }}>{sop.sop.timeframe}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e293b', border: '1px solid #334155', color: '#64748b',
              borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Objective */}
        {sop.sop.objective && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: `${colors.badge}0d`, border: `1px solid ${colors.badge}22`,
            borderRadius: 6,
          }}>
            <p style={{ fontSize: 12, color: colors.text, margin: 0, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: colors.badge }}>Goal:</span>{' '}
              {sop.sop.objective}
            </p>
          </div>
        )}

        {/* Bottleneck flag */}
        {sop.sop.bottleneckFlag && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: '#f59e0b0d', border: '1px solid #f59e0b22',
            borderRadius: 6,
          }}>
            <p style={{ fontSize: 11, color: '#fcd34d', margin: 0, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>⚠ Bottleneck signal:</span>{' '}
              {sop.sop.bottleneckFlag}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1e293b',
        background: '#0a0f1e', padding: '0 24px',
      }}>
        {(['steps', 'scripts', 'metrics'] as const)
          .filter((tab) => {
            if (tab === 'scripts') return !!sop.sop.scripts && Object.keys(sop.sop.scripts).length > 0;
            if (tab === 'metrics') return !!sop.sop.metrics && Object.keys(sop.sop.metrics).length > 0;
            return true;
          })
          .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', marginRight: 24,
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                color: activeTab === tab ? colors.badge : '#475569',
                borderBottom: activeTab === tab ? `2px solid ${colors.badge}` : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'steps' ? `Steps (${sop.sop.steps.length})` : tab === 'scripts' ? 'Scripts' : 'Metrics'}
            </button>
          ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

        {/* Steps tab */}
        {activeTab === 'steps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sop.sop.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: '#0f172a', border: '1px solid #1e293b',
                  borderRadius: 8,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: `${colors.badge}20`, border: `1px solid ${colors.badge}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: colors.badge, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                      {step.step}
                    </span>
                    {step.time && (
                      <span style={{
                        fontSize: 9, color: colors.badge, background: `${colors.badge}15`,
                        padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                      }}>
                        {step.time}
                      </span>
                    )}
                    {step.tool && (
                      <span style={{
                        fontSize: 9, color: '#64748b', background: '#1e293b',
                        padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                      }}>
                        {step.tool}
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0', lineHeight: 1.5 }}>
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scripts tab */}
        {activeTab === 'scripts' && sop.sop.scripts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(sop.sop.scripts).map(([name, content]) => (
              <div
                key={name}
                style={{
                  background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '8px 12px', background: '#111827',
                  borderBottom: '1px solid #1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
                    {name}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(content)}
                    style={{
                      background: '#1e293b', border: '1px solid #334155', color: '#64748b',
                      borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 10,
                    }}
                  >
                    Copy
                  </button>
                </div>
                <pre style={{
                  margin: 0, padding: '10px 12px',
                  fontSize: 11, lineHeight: 1.7, color: '#94a3b8',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontFamily: 'inherit',
                }}>
                  {content}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Metrics tab */}
        {activeTab === 'metrics' && sop.sop.metrics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(sop.sop.metrics).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{key}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: colors.badge,
                  background: `${colors.badge}15`, padding: '3px 10px', borderRadius: 20,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
