import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { getAuditData } from '../../check_db.functions'

export const Route = createFileRoute('/audit')({
  component: AuditComponent,
})

function AuditComponent() {
  const getAudit = useServerFn(getAuditData)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getAudit({ data: undefined }).then(setData)
  }, [])

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  )
}
