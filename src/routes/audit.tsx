import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { getAuditData } from '../../check_db.functions'

export const Route = createFileRoute('/audit')({
  component: () => {
    const getAudit = useServerFn(getAuditData)
    const [data, setData] = useState<any>(null)
    const [err, setErr] = useState<any>(null)

    useEffect(() => {
      getAudit({ data: undefined })
        .then(setData)
        .catch(setErr)
    }, [])

    if (err) return <pre>Error: {JSON.stringify(err, null, 2)}</pre>
    if (!data) return <div>Loading audit data...</div>
    
    return (
      <div style={{ padding: '20px', color: 'white', background: '#111' }}>
        <h1>Audit Data</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  }
})
