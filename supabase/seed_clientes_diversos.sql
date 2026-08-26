-- ==============================================================================
-- CARGA DE DATOS LIMPIA Y SEGURA (1 INSERT POR FILA)
-- ==============================================================================

DELETE FROM public.pagos WHERE id > 0;
DELETE FROM public.contratos WHERE id > 0;

-- 1. Contratos: Bloque del 1 al 5
INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Darwin Ramon Pina', 'V-18341397', 'J-12345678', '+58412-1630270', 'darwin.pina@ficticio.com', 'Federacion', 'Piso 1', '1-A', 180, 195, 'Del 1 al 5 de cada mes', 'Zelle', 5, 360, '01/01/2026', '31/12/2026', 'Vigente', 'Si', 'Inquilino puntual', 185, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Carlos Alberto Perez', 'V-12345678', 'J-87654321', '+58414-9876543', 'carlos.perez@ficticio.com', 'Miko', 'Piso 2', '2-B', 160, 175, 'Del 1 al 5 de cada mes', 'Pago Movil', 5, 320, '01/02/2026', '31/01/2027', 'Moroso', 'No', 'Pendiente mes actual', 165, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Ana Gabriela Gomez', 'V-20111222', 'J-99887766', '+58424-5554433', 'ana.gomez@ficticio.com', 'Miko', 'Piso 1', '1-C', 200, 215, 'Del 1 al 5 de cada mes', 'Zelle', 10, 400, '01/03/2026', '28/02/2027', 'Vigente', 'Si', 'Local comercial', 210, 3, 5);

-- 2. Contratos: Bloque del 5 al 10
INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Luis Fernando Torres', 'V-15444333', 'J-55443322', '+58416-2223344', 'luis.torres@ficticio.com', 'Federacion', 'Piso 2', '2-A', 150, 160, 'Del 5 al 10 de cada mes', 'Efectivo USD', 0, 300, '01/09/2025', '31/08/2026', 'Por Renovar', 'No', 'Contrato por renovar', 150, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Maria Elena Rivas', 'V-19888777', 'J-11223344', '+58412-8889900', 'maria.rivas@ficticio.com', 'La Candelaria', 'Piso 3', '3-A', 220, 235, 'Del 5 al 10 de cada mes', 'Transferencia BFC', 10, 440, '15/01/2026', '14/01/2027', 'Vigente', 'Si', 'Oficina administrativa', 230, 3, 5);

-- 3. Contratos: Bloque del 10 al 15
INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Roberto Jose Mendoza', 'V-14555666', 'J-33445566', '+58414-1112233', 'roberto.mendoza@ficticio.com', 'Tulipanes', 'Planta Baja', 'PB-1', 140, 150, 'Del 10 al 15 de cada mes', 'Pago Movil', 0, 280, '01/01/2026', '31/12/2026', 'Vigente', 'No', 'Apartamento PB', 140, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Valeria Sofia Castro', 'V-23999888', 'J-77889900', '+58424-7778899', 'valeria.castro@ficticio.com', 'El Morro', 'Piso 1', '1-B', 175, 190, 'Del 10 al 15 de cada mes', 'Zelle', 5, 350, '01/04/2026', '31/03/2027', 'Vigente', 'Si', 'Consultorio dental', 180, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Hector David Salazar', 'V-16777888', 'J-44332211', '+58412-3334455', 'hector.salazar@ficticio.com', 'Remanso', 'Piso 2', '2-D', 190, 205, 'Del 10 al 15 de cada mes', 'Binance Pay (USDT)', 10, 380, '01/05/2026', '30/04/2027', 'Moroso', 'Si', 'Pendiente agosto', 200, 3, 5);

-- 4. Contratos: Bloque del 15 al 20
INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Gabriela Valentina Morales', 'V-21333444', 'J-66554433', '+58414-7776655', 'gabriela.morales@ficticio.com', 'Miko', 'Piso 3', '3-B', 250, 270, 'Del 15 al 20 de cada mes', 'Zelle', 15, 500, '15/02/2026', '14/02/2027', 'Vigente', 'Si', 'Estudio fotográfico', 265, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Ricardo Andres Paredes', 'V-17888999', 'J-88776655', '+58416-9998877', 'ricardo.paredes@ficticio.com', 'La Candelaria', 'Piso 1', '1-A', 300, 320, 'Del 15 al 20 de cada mes', 'Transferencia BFC', 20, 600, '01/06/2026', '31/05/2027', 'Vigente', 'Si', 'Local tecnologia', 320, 3, 5);

-- 5. Contratos: Bloque del 25 al 30 y otros
INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Carmen Julia Benitez', 'V-13222111', 'J-22114433', '+58412-6665544', 'carmen.benitez@ficticio.com', 'Tulipanes', 'Piso 1', '1-A', 130, 140, 'Del 25 al 30 de cada mes', 'Pago Movil', 0, 260, '01/01/2026', '31/12/2026', 'Vigente', 'No', 'Puntual fin de mes', 130, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Alejandro Jose Colmenares', 'V-22444555', 'J-33221100', '+58424-8881122', 'alejandro.colmenares@ficticio.com', 'Remanso', 'Piso 1', '1-C', 165, 180, 'Dia 25 de cada mes', 'Efectivo USD', 5, 330, '25/03/2026', '24/03/2027', 'Vigente', 'Si', 'Deposito de mercancia', 170, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Patricia Carolina Vivas', 'V-18999000', 'J-99001122', '+58414-2227788', 'patricia.vivas@ficticio.com', 'El Morro', 'Piso 2', '2-A', 210, 225, 'Dia 1 de cada mes', 'Zelle', 10, 420, '01/01/2025', '31/12/2025', 'Vencido', 'Si', 'Pendiente prorroga', 220, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Eduardo Enrique Marcano', 'V-11555444', 'J-55667788', '+58412-4441199', 'eduardo.marcano@ficticio.com', 'Federacion', 'Piso 3', '3-B', 140, 150, 'Del 1 al 5 de cada mes', 'Pago Movil', 0, 280, '01/01/2025', '31/12/2025', 'Inactivo', 'No', 'Entrego el local', 140, 3, 5);

INSERT INTO public.contratos (nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad, canon_base_usd, canon_base_eur, dia_pago, metodo_pago, plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato, fecha_vencimiento, status_contrato, estacionamiento, observaciones, canon_total_usd, cargo_mora_usd, dias_gracia_mora)
VALUES ('Sofia Daniela Zambrano', 'V-24111333', 'J-44556677', '+58424-9993344', 'sofia.zambrano@ficticio.com', 'Miko', 'Planta Baja', 'PB-2', 350, 375, 'Del 1 al 5 de cada mes', 'Zelle', 20, 700, '01/04/2026', '31/03/2027', 'Para Dar de Baja', 'Si', 'Caso en legal', 370, 3, 5);

-- 6. Pagos individuales
INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Federacion', '1-A', 'Darwin Ramon Pina', 180, 5, 0, 185, 'Del 1 al 5 de cada mes', 'Al Dia', 185, '03/08/2026', 0, 185, 0, 'Zelle', 'ZEL-9921', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago puntual', 0, 185, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Miko', '1-C', 'Ana Gabriela Gomez', 200, 10, 0, 210, 'Del 1 al 5 de cada mes', 'Al Dia', 210, '04/08/2026', 0, 210, 0, 'Zelle', 'ZEL-8834', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago de canon mensual', 0, 210, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('La Candelaria', '3-A', 'Maria Elena Rivas', 220, 10, 0, 230, 'Del 5 al 10 de cada mes', 'Al Dia', 230, '07/08/2026', 0, 230, 0, 'Transferencia BFC', 'BFC-7721', 'admin@gestioncobros.com', 'Agosto 2026', 'Transferencia verificada', 0, 230, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Tulipanes', 'PB-1', 'Roberto Jose Mendoza', 140, 0, 0, 140, 'Del 10 al 15 de cada mes', 'Al Dia', 140, '12/08/2026', 0, 140, 0, 'Pago Movil', 'PM-5512', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago movil', 0, 140, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('El Morro', '1-B', 'Valeria Sofia Castro', 175, 5, 0, 180, 'Del 10 al 15 de cada mes', 'Al Dia', 180, '14/08/2026', 0, 180, 0, 'Zelle', 'ZEL-1122', 'admin@gestioncobros.com', 'Agosto 2026', 'Canon pagado', 0, 180, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Miko', '3-B', 'Gabriela Valentina Morales', 250, 15, 0, 265, 'Del 15 al 20 de cada mes', 'Al Dia', 265, '18/08/2026', 0, 265, 0, 'Zelle', 'ZEL-5544', 'admin@gestioncobros.com', 'Agosto 2026', 'Canon estudio', 0, 265, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('La Candelaria', '1-A', 'Ricardo Andres Paredes', 300, 20, 0, 320, 'Del 15 al 20 de cada mes', 'Al Dia', 320, '19/08/2026', 0, 320, 0, 'Transferencia BFC', 'BFC-9988', 'admin@gestioncobros.com', 'Agosto 2026', 'Local tecnologia', 0, 320, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Tulipanes', '1-A', 'Carmen Julia Benitez', 130, 0, 0, 130, 'Del 25 al 30 de cada mes', 'Al Dia', 130, '25/07/2026', 0, 130, 0, 'Pago Movil', 'PM-3321', 'admin@gestioncobros.com', 'Julio 2026', 'Pago julio', 0, 130, 0, true);

INSERT INTO public.pagos (inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia, deposito_cuota, canon_total_esperado, dia_pago, status_cobro, pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar, diferencia, metodo_pago, referencia, gestor, mes_cobro, observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo)
VALUES ('Remanso', '1-C', 'Alejandro Jose Colmenares', 165, 5, 0, 170, 'Dia 25 de cada mes', 'Al Dia', 170, '25/07/2026', 0, 170, 0, 'Efectivo USD', 'EFECT-01', 'admin@gestioncobros.com', 'Julio 2026', 'Deposito efectivo', 0, 170, 0, true);

-- 7. Casos legales
INSERT INTO public.casos_legales (n_caso, cliente, inmueble, unidad, estado, severidad, deuda_total, meses_deuda, fecha_apertura, abogado_asignado, notas)
VALUES (1, 'Sofia Daniela Zambrano', 'Miko', 'PB-2', 'En revision', 'Alto', 1110, 3, '15/06/2026', 'Dra. Valentina Hernandez', '3 meses de deuda acumulada.');

INSERT INTO public.casos_legales (n_caso, cliente, inmueble, unidad, estado, severidad, deuda_total, meses_deuda, fecha_apertura, abogado_asignado, notas)
VALUES (2, 'Hector David Salazar', 'Remanso', '2-D', 'Nuevo', 'Medio', 200, 1, '20/08/2026', 'Dr. Manuel Colmenares', 'Notificacion por retraso agosto.');
