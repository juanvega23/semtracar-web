import { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SelectField,
  Table,
  Td,
  TextField,
  Th,
} from '@/components/ui';
import { useRequiredCurrentUser } from '@/features/acceso';
import { formatDate, formatFullName } from '@/lib/format';
import { RoleBadge } from '../components/RoleBadge';
import { UserDetailModal } from '../components/UserDetailModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUsers } from '../hooks/useUsers';
import { PAGE_SIZE, type RoleFilter, type UserListItem } from '../services/usersService';

const ROLE_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'todos', label: 'Todos los roles' },
  { value: 'cliente', label: 'Clientes' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'repartidor', label: 'Repartidores' },
  { value: 'admin', label: 'Administradores' },
];

/** RF-60 a RF-62: usuarios y roles (solo admin). */
export function UsuariosPage() {
  const me = useRequiredCurrentUser();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('todos');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const users = useUsers({ search: debouncedSearch, role, page });
  const total = users.data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <PageHeader title="Usuarios" description="Consulta clientes y personal, y asigna roles." />
      <Card className="p-0 sm:p-0">
        <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-6">
          <TextField
            label="Buscar"
            type="search"
            placeholder="Nombre, apellido, correo o casillero"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <SelectField
            label="Rol"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RoleFilter);
              setPage(0);
            }}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
        </div>

        {users.isPending ? (
          <LoadingState message="Cargando usuarios…" />
        ) : users.isError ? (
          <ErrorState onRetry={() => void users.refetch()} />
        ) : users.data.items.length === 0 ? (
          <EmptyState
            title="No hay usuarios que coincidan"
            description={debouncedSearch ? 'Prueba con otro nombre, correo o casillero.' : undefined}
          />
        ) : (
          <>
            <div className="px-5 sm:px-0">
              <Table aria-busy={users.isFetching}>
                <thead>
                  <tr>
                    <Th className="sm:pl-6">Nombre</Th>
                    <Th>Correo</Th>
                    <Th>Casillero</Th>
                    <Th>Rol</Th>
                    <Th>Registrado</Th>
                    <Th className="sm:pr-6">
                      <span className="sr-only">Acciones</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <Td className="font-medium sm:pl-6">
                        {formatFullName({ name: u.name, last_name: u.lastName })}
                      </Td>
                      <Td className="text-slate-600">{u.email}</Td>
                      <Td className="font-mono text-xs">{u.casillero}</Td>
                      <Td>
                        <RoleBadge role={u.role} />
                      </Td>
                      <Td className="text-slate-600">{formatDate(u.createdAt)}</Td>
                      <Td className="text-right sm:pr-6">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(u)}>
                          Ver
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex flex-col items-center justify-between gap-3 p-5 text-sm text-slate-600 sm:flex-row sm:px-6">
              <p>
                {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} de {total} usuarios
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <UserDetailModal user={selected} currentUserId={me.id} onClose={() => setSelected(null)} />
    </>
  );
}
