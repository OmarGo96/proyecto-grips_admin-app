import {EmployeeDataI} from './employee-data';

export interface OperatorDataI
{
  id: number;
  empleado_id: number;
  login: string;
  company_id?: any;
  disponible_op: boolean;
  bloqueado_x_op: boolean;
  employeeData: EmployeeDataI;
}
