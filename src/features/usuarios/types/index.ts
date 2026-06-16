export type Rol = "admin" | "reclutador" | "evaluador";
export type EstadoUsuario = "activo" | "inactivo";

export type Usuario = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono: string;
  rol: Rol;
  estado: EstadoUsuario;
  is_active: boolean;
  date_joined: string;
};

export type CreateUsuarioDto = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  password: string;
  rol: Rol;
};

export type UpdateUsuarioDto = Partial<Omit<CreateUsuarioDto, "password">> & {
  estado?: EstadoUsuario;
};
