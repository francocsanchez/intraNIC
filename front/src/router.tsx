import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Loading from "./components/Loading";
import { paths } from "./routes/paths";

const NICLayout = lazy(() => import("./layouts/NICLayout"));
const LiessLayout = lazy(() => import("./layouts/LiessLayout"));
const AdminModuleLayout = lazy(() => import("./layouts/AdminModuleLayout"));
const PatentamientosLayout = lazy(() => import("./layouts/PatentamientosLayout"));
const TransferenciasLayout = lazy(() => import("./layouts/TransferenciasLayout"));
const CallCenterLayout = lazy(() => import("./layouts/CallCenterLayout"));
const ProfileLayout = lazy(() => import("./layouts/ProfileLayout"));
const EntregasLayout = lazy(() => import("./layouts/EntregasLayout"));
const GestionConvencionalLayout = lazy(() => import("./layouts/GestionConvencionalLayout"));
const GestionUsadosLayout = lazy(() => import("./layouts/GestionUsadosLayout"));
const AnalisisLayout = lazy(() => import("./layouts/AnalisisLayout"));
const ProtectedRoute = lazy(() => import("./layouts/ProtectedRoute"));
const ModuleProtectedRoute = lazy(() => import("./layouts/ModuleProtectedRoute"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const NICUsadosLayout = lazy(() => import("./layouts/NICUsadosLayout"));

const ConfiguracionView = lazy(() => import("./views/admin/configuracion/ConfiguracionView"));
const VendedoresView = lazy(() => import("./views/admin/configuracion/VendedoresView"));
const EditConfiguracionConvView = lazy(() => import("./views/admin/configuracion/EditConfiguracionConvView"));
const EditConfiguracionUsadoView = lazy(() => import("./views/admin/configuracion/EditConfiguracionUsadoView"));
const UsuariosView = lazy(() => import("./views/admin/usuarios/UsuariosView"));
const EditUsuarioView = lazy(() => import("./views/admin/usuarios/EditUsuarioView"));
const CrearUsuarioView = lazy(() => import("./views/admin/usuarios/CrearUsuarioView"));
const TestDriveView = lazy(() => import("./views/admin/testDrive/TestDriveView"));
const MiPerfilView = lazy(() => import("./views/auth/MiPerfilView"));
const MisOperacionesView = lazy(() => import("./views/auth/MisOperacionesView"));
const MisReservas = lazy(() => import("./views/auth/MisReservas"));
const MiListaDeEsperaView = lazy(() => import("./views/auth/MiListaDeEsperaView"));
const LoginUser = lazy(() => import("./views/auth/LoginUser"));
const Inicio = lazy(() => import("./views/Inicio"));
const AdministracionHubView = lazy(() => import("./views/admin/AdministracionHubView"));
const NotFoundView = lazy(() => import("./views/NotFoundView"));
const NoAutorizadoView = lazy(() => import("./views/NoAutorizadoView"));
const StockDisponibleConvencional = lazy(() => import("./views/convencional/StockDisponibleConvencional"));
const StockGuardadoConvencioanl = lazy(() => import("./views/convencional/StockGuardadoConvencioanl"));
const StockReservasConvencional = lazy(() => import("./views/convencional/StockReservasConvencional"));
const StockDisponibleLiess = lazy(() => import("./views/liess/StockDisponibleLiess"));
const AsignacionesView = lazy(() => import("./views/admin/siac/AsignacionesView"));
const StockDisponibleUsados = lazy(() => import("./views/usados/StockDisponibleUsados"));
const StockGuardadoUsados = lazy(() => import("./views/usados/StockGuardadoUsados"));
const MisReservasUsadosView = lazy(() => import("./views/usados/MisReservasUsadosView"));
const StockNoReparadoUsadosView = lazy(() => import("./views/usados/StockNoReparadoUsadosView"));
const StockPendDocuUsadosView = lazy(() => import("./views/usados/StockPendDocuUsadosView"));
const StockReservasUsados = lazy(() => import("./views/usados/StockReservasUsados"));
const StockIngresoUsados = lazy(() => import("./views/usados/StockIngresoUsados"));
const PendienteReventaView = lazy(() => import("./views/admin/siac/PendienteReventaView"));
const PromediosConvencionalView = lazy(() => import("./views/admin/siac/PromediosConvencionalView"));
const RankingConvencionalView = lazy(() => import("./views/admin/siac/RankingConvencionalView"));
const PedidoUnidadesView = lazy(() => import("./views/admin/siac/PedidoUnidadesView"));
const PedidoUnidadesPreviasView = lazy(() => import("./views/admin/siac/PedidoUnidadesPreviasView"));
const FacturasAnticipoView = lazy(() => import("./views/admin/siac/FacturasAnticipoView"));
const SegUnidadesFabricaView = lazy(() => import("./views/admin/siac/SegUnidadesFabricaView"));
const RegistroAsignacionesView = lazy(() => import("./views/admin/siac/RegistroAsignacionesView"));
const RegistroAsignacionesResumenView = lazy(() => import("./views/admin/siac/RegistroAsignacionesResumenView"));
const AnalisisStockView = lazy(() => import("./views/admin/siac/AnalisisStockView"));
const AnalisisStockVersionesView = lazy(() => import("./views/admin/siac/AnalisisStockVersionesView"));
const PendFacView = lazy(() => import("./views/admin/siac/PendFacView"));
const PreventasView = lazy(() => import("./views/admin/siac/PreventasView"));
const PreventasAsignadasView = lazy(() => import("./views/admin/siac/PreventasAsignadasView"));
const PreventasResumenView = lazy(() => import("./views/admin/siac/PreventasResumenView"));
const ColoresView = lazy(() => import("./views/admin/siac/ColoresView"));
const VersionesView = lazy(() => import("./views/admin/siac/VersionesView"));
const PlanNegocioCrudView = lazy(() => import("./views/admin/siac/PlanNegocioCrudView"));
const PlanNegocioView = lazy(() => import("./views/admin/siac/PlanNegocioView"));
const PedidoMensualView = lazy(() => import("./views/admin/siac/PedidoMensualView"));
const ProformasView = lazy(() => import("./views/admin/siac/ProformasView"));
const ProformaFormView = lazy(() => import("./views/admin/siac/ProformaFormView"));
const ProformaDetailView = lazy(() => import("./views/admin/siac/ProformaDetailView"));
const MinutasView = lazy(() => import("./views/comercial/MinutasView"));
const MinutaCreateView = lazy(() => import("./views/comercial/MinutaCreateView"));
const MinutaEditView = lazy(() => import("./views/comercial/MinutaEditView"));
const TestDriveRegistroView = lazy(() => import("./views/comercial/TestDriveRegistroView"));
const TestDriveCalendarioView = lazy(() => import("./views/comercial/TestDriveCalendarioView"));
const OperacionesDashboardView = lazy(() => import("./views/operaciones/OperacionesDashboardView"));
const DashboardPatentamientosView = lazy(() => import("./views/patentamientos/DashboardPatentamientosView"));
const DashboardTransferenciasView = lazy(() => import("./views/transferencias/DashboardTransferenciasView"));
const InscripcionUnidadesView = lazy(() => import("./views/patentamientos/InscripcionUnidadesView"));
const PatentamientosRegistrosView = lazy(() => import("./views/patentamientos/PatentamientosRegistrosView"));
const PromediosPlanAhorroView = lazy(() => import("./views/admin/siac/PromediosPlanAhorroView"));
const AgendaEntregaView = lazy(() => import("./views/entregas/AgendaEntregaView"));
const PendientesTurnarView = lazy(() => import("./views/entregas/PendientesTurnarView"));
const SucursalesEntregaView = lazy(() => import("./views/entregas/SucursalesEntregaView"));
const AgendaEntregaRegistrosView = lazy(() => import("./views/entregas/AgendaEntregaRegistrosView"));
const CallCenterImportView = lazy(() => import("./views/callCenter/CallCenterImportView"));
const CallCenterOriginsView = lazy(() => import("./views/callCenter/CallCenterOriginsView"));

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path={paths.login} element={<LoginUser />} />
          <Route path={paths.notFound} element={<NotFoundView />} />
          <Route path="*" element={<NotFoundView />} />

          <Route element={<ProtectedRoute />}>
            <Route path={paths.home} element={<Inicio />} />
            <Route element={<ProfileLayout />}>
              <Route path={paths.miPerfil} element={<MiPerfilView />} />
            </Route>
            <Route path={paths.noAutorizado} element={<NoAutorizadoView />} />

            <Route element={<ModuleProtectedRoute allowedModules={["callCenter"]} />}>
              <Route element={<CallCenterLayout />}>
                <Route path={paths.callCenter.home} element={<Navigate to={paths.callCenter.importar} replace />} />
                <Route path={paths.callCenter.importar} element={<CallCenterImportView />} />
                <Route path={paths.callCenter.origenesDatos} element={<CallCenterOriginsView />} />
              </Route>
            </Route>

            <Route element={<EntregasLayout />}>
              <Route element={<ModuleProtectedRoute allowedModules={["agendaEntrega"]} />}>
                <Route path={paths.entregas.agenda} element={<AgendaEntregaView />} />
                <Route path={paths.entregas.sucursales} element={<SucursalesEntregaView />} />
                <Route path={paths.entregas.registros} element={<AgendaEntregaRegistrosView />} />
              </Route>

              <Route element={<ModuleProtectedRoute allowedModules={["pendientesTurnar"]} />}>
                <Route path={paths.entregas.pendientesTurnar} element={<PendientesTurnarView />} />
              </Route>
            </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["usuarios"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.usuarios} element={<UsuariosView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["configuracion"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.configuracion} element={<ConfiguracionView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["testDrive"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.testDrive} element={<TestDriveView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["usuarios"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.crearUsuario} element={<CrearUsuarioView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["usuarios"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.editarUsuarioRoute} element={<EditUsuarioView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["configuracion"]} />}>
            <Route element={<AdminLayout />}>
              <Route path={paths.admin.configuracionConvencionalEditar} element={<EditConfiguracionConvView />} />
              <Route path={paths.admin.configuracionUsadosEditar} element={<EditConfiguracionUsadoView />} />
              <Route path={paths.admin.planNegocio} element={<PlanNegocioCrudView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["reventaPendientes", "listaPrevia", "facturasAnticipo", "segUnidadesFabrica"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.home} element={<AdministracionHubView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["reventaPendientes"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.reventaPendientes} element={<PendienteReventaView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["listaPrevia"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.pedidoUnidadesListaPrevia} element={<PedidoUnidadesPreviasView />} />
              <Route path={paths.administracion.pedidoUnidadesRegistros} element={<PedidoUnidadesView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["facturasAnticipo"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.facturasAnticipo} element={<FacturasAnticipoView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["segUnidadesFabrica"]} />}>
            <Route element={<AdminModuleLayout />}>
              <Route path={paths.administracion.segUnidadesFabrica} element={<SegUnidadesFabricaView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["proformas"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.convencional.proformas} element={<ProformasView />} />
              <Route path={paths.convencional.proformasNueva} element={<ProformaFormView />} />
              <Route path={paths.convencional.proformasDetalleRoute} element={<ProformaDetailView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["minutas"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.convencional.minutas} element={<MinutasView />} />
              <Route path={paths.convencional.minutasNueva} element={<MinutaCreateView />} />
              <Route path={paths.convencional.minutasEditarRoute} element={<MinutaEditView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["registroTestDriveConvencional"]} />}>
            <Route element={<NICLayout />}>
              <Route
                path={paths.convencional.registroTestDrive}
                element={
                  <TestDriveRegistroView
                    negocio="convencional"
                    sectionLabel="Comercial"
                    title="Registro TestDrive"
                    calendarPath={paths.convencional.registroTestDriveCalendario}
                    queryKeyPrefix="test-drive-registros-convencional"
                  />
                }
              />
              <Route
                path={paths.convencional.registroTestDriveCalendario}
                element={
                  <TestDriveCalendarioView
                    negocio="convencional"
                    sectionLabel="Comercial"
                    title="Calendario TestDrive"
                    listPath={paths.convencional.registroTestDrive}
                    queryKeyPrefix="test-drive-registros-convencional"
                  />
                }
              />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["registroTestDrive"]} />}>
            <Route element={<NICLayout />}>
              <Route
                path={paths.planAhorro.registroTestDrive}
                element={
                  <TestDriveRegistroView
                    negocio="planAhorro"
                    sectionLabel="Plan de ahorro"
                    title="Registro TestDrive"
                    calendarPath={paths.planAhorro.registroTestDriveCalendario}
                    queryKeyPrefix="test-drive-registros-plan-ahorro"
                  />
                }
              />
              <Route
                path={paths.planAhorro.registroTestDriveCalendario}
                element={
                  <TestDriveCalendarioView
                    negocio="planAhorro"
                    sectionLabel="Plan de ahorro"
                    title="Calendario TestDrive"
                    listPath={paths.planAhorro.registroTestDrive}
                    queryKeyPrefix="test-drive-registros-plan-ahorro"
                  />
                }
              />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["promediosPlanAhorro"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.planAhorro.promedios} element={<PromediosPlanAhorroView />} />
            </Route>
          </Route>

          <Route element={<AnalisisLayout />}>
            <Route element={<ModuleProtectedRoute allowedModules={["operaciones"]} />}>
              <Route path={paths.analisis.operaciones} element={<OperacionesDashboardView />} />
            </Route>

            <Route element={<ModuleProtectedRoute allowedModules={["actualizacionRegistros"]} />}>
              <Route path={paths.analisis.registros} element={<PatentamientosRegistrosView />} />
            </Route>

            <Route element={<ModuleProtectedRoute allowedModules={["ranking"]} />}>
              <Route path={paths.convencional.ranking} element={<RankingConvencionalView />} />
            </Route>
            <Route element={<ModuleProtectedRoute allowedModules={["promedio"]} />}>
              <Route path={paths.convencional.promedio} element={<PromediosConvencionalView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["patentamientos"]} />}>
            <Route element={<PatentamientosLayout />}>
              <Route path={paths.analisis.patentamientos.home} element={<Navigate to={paths.analisis.patentamientos.dashboardGeneral} replace />} />
              <Route path={paths.analisis.patentamientos.dashboard} element={<Navigate to={paths.analisis.patentamientos.dashboardGeneral} replace />} />
              <Route path={paths.analisis.patentamientos.dashboardInscripcionUnidades} element={<InscripcionUnidadesView />} />
              <Route path={paths.analisis.patentamientos.dashboardSectionRoute} element={<DashboardPatentamientosView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["transferencias"]} />}>
            <Route element={<TransferenciasLayout />}>
              <Route path={paths.analisis.transferencias.home} element={<Navigate to={paths.analisis.transferencias.dashboardGeneral} replace />} />
              <Route path={paths.analisis.transferencias.dashboard} element={<Navigate to={paths.analisis.transferencias.dashboardGeneral} replace />} />
              <Route path={paths.analisis.transferencias.dashboardSectionRoute} element={<DashboardTransferenciasView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["configuracion"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.admin.vendedores} element={<VendedoresView />} />
              <Route path={paths.convencional.preventasColores} element={<ColoresView />} />
              <Route path={paths.convencional.preventasColoresNuevo} element={<Navigate to={paths.convencional.preventasColores} replace />} />
              <Route path={paths.convencional.preventasColoresEditarRoute} element={<Navigate to={paths.convencional.preventasColores} replace />} />
              <Route path={paths.convencional.preventasVersiones} element={<VersionesView />} />
              <Route path={paths.convencional.preventasVersionesNuevo} element={<Navigate to={paths.convencional.preventasVersiones} replace />} />
              <Route path={paths.convencional.preventasVersionesEditarRoute} element={<Navigate to={paths.convencional.preventasVersiones} replace />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["convencional"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.convencional.stockGuardado} element={<StockGuardadoConvencioanl />} />
              <Route path={paths.convencional.stockReservado} element={<StockReservasConvencional />} />
              <Route path={paths.convencional.misReservas} element={<MisReservas />} />
              <Route path={paths.convencional.miListaEspera} element={<MiListaDeEsperaView />} />
              <Route path={paths.convencional.misOperaciones} element={<MisOperacionesView />} />
              <Route path={paths.convencional.stockDisponible} element={<StockDisponibleConvencional />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["preventas"]} />}>
            <Route element={<NICLayout />}>
              <Route path={paths.convencional.preventas} element={<PreventasView />} />
              <Route path={paths.convencional.preventasResumen} element={<PreventasResumenView />} />
              <Route path={paths.convencional.preventasAsignadas} element={<PreventasAsignadasView />} />
              <Route path={paths.convencional.preventasNueva} element={<PreventasView />} />
              <Route path={paths.convencional.preventasEditarRoute} element={<PreventasView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["planNegocio"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.planNegocio} element={<PlanNegocioView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["asignaciones"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.asignaciones} element={<AsignacionesView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["registroAsignaciones"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.registroAsignaciones} element={<RegistroAsignacionesView />} />
              <Route path={paths.convencional.registroAsignacionesResumen} element={<RegistroAsignacionesResumenView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["pedidoMensual"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.pedidoMensual} element={<PedidoMensualView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["pedidoUnidades", "listaPrevia"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.pedidoUnidades} element={<PedidoUnidadesView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["analisisStock"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.analisisStock} element={<AnalisisStockView />} />
              <Route
                path={paths.convencional.analisisStockDiccionarioVersiones}
                element={<AnalisisStockVersionesView />}
              />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["pendFac"]} />}>
            <Route element={<GestionConvencionalLayout />}>
              <Route path={paths.convencional.pendFac} element={<PendFacView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["usados"]} />}>
            <Route element={<NICUsadosLayout />}>
              <Route path={paths.usados.stockDisponible} element={<StockDisponibleUsados />} />
              <Route path={paths.usados.misOperaciones} element={<MisOperacionesView />} />
              <Route path={paths.usados.misReservas} element={<MisReservasUsadosView />} />
              <Route path={paths.usados.stockGuardado} element={<StockGuardadoUsados />} />
              <Route path={paths.usados.stockReservado} element={<StockReservasUsados />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["noReparado"]} />}>
            <Route element={<GestionUsadosLayout />}>
              <Route path={paths.usados.stockNoReparado} element={<StockNoReparadoUsadosView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["pendienteDocumentacion"]} />}>
            <Route element={<GestionUsadosLayout />}>
              <Route path={paths.usados.stockPendienteDocumentacion} element={<StockPendDocuUsadosView />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["ingresos"]} />}>
            <Route element={<GestionUsadosLayout />}>
              <Route path={paths.usados.stockIngresos} element={<StockIngresoUsados />} />
            </Route>
          </Route>

          <Route element={<ModuleProtectedRoute allowedModules={["liess"]} />}>
            <Route element={<LiessLayout />}>
                <Route path={paths.liess.stockDisponibleRoute} element={<StockDisponibleLiess />} />
            </Route>
          </Route>

          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

