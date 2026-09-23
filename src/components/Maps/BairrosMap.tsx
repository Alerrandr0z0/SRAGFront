import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { TerritoryEntity } from '../../service/srag/sragClient';

interface BairrosMapProps {
  entities: TerritoryEntity[];
  zonas?: Array<{ label: string; count: number }>;
}

type BairroFeature = Feature<Geometry, { bairro?: string; count: number }>;

// Nós da rampa YlOrRd (mesmos do d3.interpolateYlOrRd / ColorBrewer).
const YL_OR_RD = [
  '#ffffcc',
  '#ffeda0',
  '#fed976',
  '#feb24c',
  '#fd8d3c',
  '#fc4e2a',
  '#e31a1c',
  '#bd0026',
  '#800026',
];

const LEGEND_GRADIENT =
  'linear-gradient(to right, #fff7ec, #fee8c8, #fdd49e, #fdbb84, #fc8d59, #ef6548, #d7301f, #990000)';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function ylOrRd(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (YL_OR_RD.length - 1);
  const i = Math.min(YL_OR_RD.length - 2, Math.floor(x));
  const f = x - i;
  const [r1, g1, b1] = hexToRgb(YL_OR_RD[i]);
  const [r2, g2, b2] = hexToRgb(YL_OR_RD[i + 1]);
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function normalizeBairroName(value: string | undefined | null): string {
  return (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
}

const DarkModeTileFilter: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const map = useMap();

  useEffect(() => {
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
    }
  }, [isDark, map]);

  return null;
};

const BairrosMap: React.FC<BairrosMapProps> = ({ entities, zonas = [] }) => {
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch('/geo/mossoro_bairros.geojson?v=sinan30b')
      .then((res) => res.json())
      .then((data: FeatureCollection) => setGeo(data))
      .catch(() => setGeo(null));
  }, []);

  const byBairro = useMemo(() => {
    const map = new Map<string, TerritoryEntity>();
    for (const e of entities ?? []) map.set(normalizeBairroName(e.bairro), e);
    return map;
  }, [entities]);

  const maxVal = useMemo(
    () => Math.max(1, ...Array.from(byBairro.values(), (e) => Number(e.count ?? 0))),
    [byBairro],
  );

  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(maxVal);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [hoveringBar, setHoveringBar] = useState(false);

  useEffect(() => {
    setRangeMin(0);
    setRangeMax(maxVal);
    setHoverValue(null);
  }, [maxVal]);

  const colorForCount = (count: number): string =>
    count > 0 ? ylOrRd(count / maxVal) : isDark ? '#334155' : '#e2e8f0';

  const baseFillFor = (count: number, inRange: boolean): string => {
    if (inRange) return colorForCount(count);
    return isDark ? '#1e293b' : '#f1f5f9';
  };

  const styleFor = (count: number) => {
    const inRange = count >= rangeMin && count <= rangeMax;
    const hoveredCount = hoveringBar ? hoverValue : null;
    const isHovered = hoveredCount !== null && Math.abs(count - hoveredCount) <= 1;
    const fillColor = baseFillFor(count, inRange);
    if (isHovered) {
      return { color: '#0f172a', weight: 2.4, fillColor, fillOpacity: 1 };
    }
    return {
      color: isDark ? '#f8fafc' : '#0f172a',
      weight: 0.5,
      fillColor,
      fillOpacity: inRange ? 0.85 : 0.3,
    };
  };

  const features = useMemo<BairroFeature[]>(() => {
    if (!geo) return [];
    return (geo.features as BairroFeature[]).map((f) => ({
      ...f,
      properties: {
        ...(f.properties ?? {}),
        count: Number(byBairro.get(normalizeBairroName(f.properties?.bairro))?.count ?? 0),
      },
    }));
  }, [geo, byBairro]);

  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: updates layer styles in-place without unmounting SVG nodes
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        if ('setStyle' in layer && typeof layer.setStyle === 'function') {
          const feature = (layer as unknown as { feature?: BairroFeature }).feature;
          const count = Number(feature?.properties?.count ?? 0);
          layer.setStyle(styleFor(count));
        }
      });
    }
  }, [rangeMin, rangeMax, hoverValue, hoveringBar, isDark, maxVal]);

  const zonaStats = useMemo(() => {
    const urbana = zonas.find((z) => normalizeBairroName(z.label) === 'URBANA')?.count ?? 0;
    const rural = zonas.find((z) => normalizeBairroName(z.label) === 'RURAL')?.count ?? 0;
    const total = urbana + rural;
    return {
      urbana,
      rural,
      urbanaPct: total > 0 ? (urbana / total) * 100 : 0,
      ruralPct: total > 0 ? (rural / total) * 100 : 0,
    };
  }, [zonas]);

  const overlayBg = isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const overlayBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <>
      <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="mb-4 justify-between gap-4 sm:flex">
          <div>
            <h4 className="text-xl font-semibold text-black dark:text-white">Mapa territorial</h4>
          </div>
        </div>

        <div className="relative">
          <MapContainer
            center={[-5.18, -37.34]}
            zoom={12}
            style={{ height: '480px', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <DarkModeTileFilter isDark={isDark} />
            {features.length > 0 && (
              <GeoJSON
                // Key changes only when underlying data changes (new ingest), not on hover/slider
                key={JSON.stringify(features.map((f) => f.properties?.count))}
                ref={geoJsonRef}
                data={{ type: 'FeatureCollection', features } as FeatureCollection}
                style={(feature) => {
                  const props = (feature?.properties ?? {}) as { bairro?: string; count?: number };
                  return styleFor(Number(props.count ?? 0));
                }}
                onEachFeature={(feature, layer) => {
                  const props = (feature.properties ?? {}) as {
                    bairro?: string;
                    count?: number;
                  };
                  const entity = byBairro.get(normalizeBairroName(props.bairro));
                  const c = Number(props.count ?? 0);
                  layer.bindTooltip(
                    `<strong>${props.bairro ?? '—'}</strong><br/>${c} ${c === 1 ? 'caso' : 'casos'}<br/>Curados: ${Number(entity?.curados ?? 0)}<br/>Óbitos: ${Number(entity?.obitos ?? 0)}`,
                    { sticky: true },
                  );
                }}
              />
            )}
          </MapContainer>

          <div
            className="absolute bottom-4 left-4 z-[1000]"
            style={{
              background: overlayBg,
              borderRadius: 8,
              padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(4px)',
              border: `1px solid ${overlayBorder}`,
              minWidth: 180,
            }}
          >
            <p
              style={{
                margin: '0 0 6px 0',
                fontSize: '10px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Casos por Bairro
            </p>
            <div style={{ position: 'relative' }}>
              <div
                ref={barRef}
                role="img"
                aria-label="Escala de casos por bairro"
                onMouseMove={(e) => {
                  if (!barRef.current) return;
                  const rect = barRef.current.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  setHoveringBar(true);
                  setHoverValue(Math.round(Math.min(Math.max(pct, 0), 1) * maxVal));
                }}
                onMouseLeave={() => {
                  setHoveringBar(false);
                  setHoverValue(null);
                }}
                style={{
                  width: '100%',
                  height: 12,
                  borderRadius: 4,
                  cursor: 'crosshair',
                  background: LEGEND_GRADIENT,
                }}
              />
              {hoverValue !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: `${(hoverValue / maxVal) * 100}%`,
                    transform: 'translateX(-50%)',
                    background: isDark ? '#1e293b' : '#0f172a',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {hoverValue.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>
                {rangeMin.toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: 9, color: '#64748b' }}>
                {rangeMax.toLocaleString('pt-BR')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: isDark ? '#cbd5e1' : '#334155' }}>
                Mín: {rangeMin.toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: 10, color: isDark ? '#cbd5e1' : '#334155' }}>
                Máx: {rangeMax.toLocaleString('pt-BR')}
              </span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={maxVal}
                step={1}
                value={rangeMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRangeMin(Math.min(v, rangeMax));
                }}
                style={{ flex: 1, height: 4, accentColor: '#f97316' }}
              />
              <input
                type="range"
                min={0}
                max={maxVal}
                step={1}
                value={rangeMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRangeMax(Math.max(v, rangeMin));
                }}
                style={{ flex: 1, height: 4, accentColor: '#dc2626' }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-stroke pt-5 dark:border-strokedark">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-bodydark2">
            Distribuição por zona
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            <div style={{ width: `${zonaStats.urbanaPct}%`, backgroundColor: '#0f766e' }} />
            <div style={{ width: `${zonaStats.ruralPct}%`, backgroundColor: '#d97706' }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#0f766e' }}
              />
              <span className="text-sm font-semibold text-black dark:text-white">Urbana</span>
              <span className="text-lg font-bold text-black dark:text-white">
                {zonaStats.urbanaPct.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-bodydark2">
                ({zonaStats.urbana.toLocaleString('pt-BR')} casos)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#d97706' }}
              />
              <span className="text-sm font-semibold text-black dark:text-white">Rural</span>
              <span className="text-lg font-bold text-black dark:text-white">
                {zonaStats.ruralPct.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-bodydark2">
                ({zonaStats.rural.toLocaleString('pt-BR')} casos)
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BairrosMap;
