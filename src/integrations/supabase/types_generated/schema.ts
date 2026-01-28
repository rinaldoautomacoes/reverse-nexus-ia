import type { Json } from './database';

-- Import modular table types
import type { ClientRow, ClientInsert, ClientUpdate, ClientRelationships } from './tables/clients';
import type { ColetaRow, ColetaInsert, ColetaUpdate, ColetaRelationships } from './tables/coletas';
import type { DriverRow, DriverInsert, DriverUpdate, DriverRelationships } from './tables/drivers';
import type { ItemRow, ItemInsert, ItemUpdate, ItemRelationships } from './tables/items';
import type { MetricRow, MetricInsert, MetricUpdate, MetricRelationships } from './tables/metrics';
import type { ProductRow, ProductInsert, ProductUpdate, ProductRelationships } from './tables/products';
import type { ProfileRow, ProfileInsert, ProfileUpdate, ProfileRelationships } from './tables/profiles';
import type { ReportRow, ReportInsert, ReportUpdate, ReportRelationships } from './tables/reports';
import type { RouteStopRow, RouteStopInsert, RouteStopUpdate, RouteStopRelationships } from './tables/route_stops';
import type { RouteRow, RouteInsert, RouteUpdate, RouteRelationships } from './tables/routes';
import type { TransportadoraRow, TransportadoraInsert, TransportadoraUpdate, TransportadoraRelationships } from './tables/transportadoras';
import type { OutstandingCollectionItemRow, OutstandingCollectionItemInsert, OutstandingCollectionItemUpdate, OutstandingCollectionItemRelationships } from './tables/outstanding_collection_items';
import type { DebtRecordRow, DebtRecordInsert, DebtRecordUpdate, DebtRecordRelationships } from './tables/debt_records'; // New import
import type { PestControlServiceRow, PestControlServiceInsert, PestControlServiceUpdate, PestControlServiceRelationships } from './tables/pest_control_services'; // New import

export type PublicSchema = {
  Tables: {
    clients: {
      Row: ClientRow;
      Insert: ClientInsert;
      Update: ClientUpdate;
      Relationships: ClientRelationships;
    };
    coletas: {
      Row: ColetaRow;
      Insert: ColetaInsert;
      Update: ColetaUpdate;
      Relationships: ColetaRelationships;
    };
    outstanding_collection_items: {
      Row: OutstandingCollectionItemRow;
      Insert: OutstandingCollectionItemInsert;
      Update: OutstandingCollectionItemUpdate;
      Relationships: OutstandingCollectionItemRelationships;
    };
    drivers: {
      Row: DriverRow;
      Insert: DriverInsert;
      Update: DriverUpdate;
      Relationships: DriverRelationships;
    };
    items: {
      Row: ItemRow;
      Insert: ItemInsert;
      Update: ItemUpdate;
      Relationships: ItemRelationships;
    };
    metrics: {
      Row: MetricRow;
      Insert: MetricInsert;
      Update: MetricUpdate;
      Relationships: MetricRelationships;
    };
    products: {
      Row: ProductRow;
      Insert: ProductInsert;
      Update: ProductUpdate;
      Relationships: ProductRelationships;
    };
    profiles: {
      Row: ProfileRow;
      Insert: ProfileInsert;
      Update: ProfileUpdate;
      Relationships: ProfileRelationships;
    };
    reports: {
      Row: ReportRow;
      Insert: ReportInsert;
      Update: ReportUpdate;
      Relationships: ReportRelationships;
    };
    route_stops: {
      Row: RouteStopRow;
      Insert: RouteStopInsert;
      Update: RouteStopUpdate;
      Relationships: RouteStopRelationships;
    };
    routes: {
      Row: RouteRow;
      Insert: RouteInsert;
      Update: RouteUpdate;
      Relationships: RouteRelationships;
    };
    transportadoras: {
      Row: TransportadoraRow;
      Insert: TransportadoraInsert;
      Update: TransportadoraUpdate;
      Relationships: TransportadoraRelationships;
    };
    debt_records: {
      Row: DebtRecordRow;
      Insert: DebtRecordInsert;
      Update: DebtRecordUpdate;
      Relationships: DebtRecordRelationships;
    };
    pest_control_services: {
      Row: PestControlServiceRow;
      Insert: PestControlServiceInsert;
      Update: PestControlServiceUpdate;
      Relationships: PestControlServiceRelationships;
    };
  }
  Views: {
    [_ in never]: never
  }
  Functions: {
    get_user_role: {
      Args: { _user_id: string }
      Returns: string
    }
    has_role: {
      Args: { _user_id: string; _role: string }
      Returns: boolean
    }
    handle_new_user: {
      Args: Record<PropertyKey, never>
      Returns: string
    }
  }
  Enums: {
    app_role: "admin" | "standard" | "technician" | "supervisor";
    pest_service_status: "agendado" | "em_andamento" | "concluido" | "cancelado";
    pest_service_priority: "normal" | "urgente" | "contrato";
  }
  CompositeTypes: {
    [_ in never]: never
  }
}