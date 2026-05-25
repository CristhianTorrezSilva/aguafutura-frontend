import { useState } from 'react';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import { REFERENCE_TYPES } from '../utils/enums';

export default function EvidencePage() {
  const [reference, setReference] = useState({ referenceType: 'ASSET', referenceId: '' });

  return (
    <div className="page">
      <PageHeader title="Evidencia" description="Listado, subida y descarga usando la URL devuelta por backend." />
      <div className="panel">
        <h2 className="section-title">Referencia</h2>
        <div className="form-grid">
          <FormField label="referenceType">
            <select
              value={reference.referenceType}
              onChange={(event) => setReference({ ...reference, referenceType: event.target.value })}
            >
              {REFERENCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </FormField>
          <FormField label="referenceId">
            <input
              value={reference.referenceId}
              onChange={(event) => setReference({ ...reference, referenceId: event.target.value })}
              placeholder="uuid"
            />
          </FormField>
        </div>
      </div>

      {reference.referenceId && (
        <EvidencePanel referenceType={reference.referenceType} referenceId={reference.referenceId} />
      )}
    </div>
  );
}
