export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _ModelVendors: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_ModelVendors_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "AssetModel"
            referencedColumns: ["ModelID"]
          },
          {
            foreignKeyName: "_ModelVendors_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["VendorID"]
          },
        ]
      }
      access_request_items: {
        Row: {
          access_request_id: string
          external_process_flag: boolean
          field_name: string
          field_type: string
          id: string
          justification: string | null
          section_name: string | null
          value: string | null
        }
        Insert: {
          access_request_id: string
          external_process_flag?: boolean
          field_name: string
          field_type: string
          id?: string
          justification?: string | null
          section_name?: string | null
          value?: string | null
        }
        Update: {
          access_request_id?: string
          external_process_flag?: boolean
          field_name?: string
          field_type?: string
          id?: string
          justification?: string | null
          section_name?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ari_request_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      access_request_sections: {
        Row: {
          access_request_id: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          access_request_id: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          access_request_id?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "ars_request_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      access_request_status_logs: {
        Row: {
          access_request_id: string
          changed_by: string
          comments: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          access_request_id: string
          changed_by: string
          comments?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          access_request_id?: string
          changed_by?: string
          comments?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arsl_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
          {
            foreignKeyName: "arsl_request_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      access_requests: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string
          employee_id: string
          finalized_at: string | null
          id: string
          onboarding_request_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by: string
          employee_id: string
          finalized_at?: string | null
          id?: string
          onboarding_request_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string
          employee_id?: string
          finalized_at?: string | null
          id?: string
          onboarding_request_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_onboarding_request_id_fkey"
            columns: ["onboarding_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
          {
            foreignKeyName: "ar_employee_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["EmployeeID"]
          },
        ]
      }
      ad_provisioning_logs: {
        Row: {
          access_request_id: string | null
          action_type: string
          created_at: string | null
          details: string | null
          executor_id: string | null
          group_dn: string
          id: string
          status: string
          user_dn: string
        }
        Insert: {
          access_request_id?: string | null
          action_type?: string
          created_at?: string | null
          details?: string | null
          executor_id?: string | null
          group_dn: string
          id?: string
          status?: string
          user_dn: string
        }
        Update: {
          access_request_id?: string | null
          action_type?: string
          created_at?: string | null
          details?: string | null
          executor_id?: string | null
          group_dn?: string
          id?: string
          status?: string
          user_dn?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_provisioning_logs_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_provisioning_logs_executor_id_fkey"
            columns: ["executor_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
        ]
      }
      Asset: {
        Row: {
          AssetID: string
          AssetName: string | null
          AssetTag: string | null
          AssetType: string | null
          Brand: string | null
          Condition: string | null
          createdAt: string
          DeviceTag: string | null
          Location: string | null
          Model: string | null
          ModelID: string | null
          Notes: string | null
          OperationalState: string | null
          OwnershipType: string | null
          ProcurementItemID: string | null
          PurchaseDate: string | null
          Quantity: number | null
          SerialNumber: string | null
          Status: string | null
          StorageLocationID: string | null
          updatedAt: string
        }
        Insert: {
          AssetID: string
          AssetName?: string | null
          AssetTag?: string | null
          AssetType?: string | null
          Brand?: string | null
          Condition?: string | null
          createdAt?: string
          DeviceTag?: string | null
          Location?: string | null
          Model?: string | null
          ModelID?: string | null
          Notes?: string | null
          OperationalState?: string | null
          OwnershipType?: string | null
          ProcurementItemID?: string | null
          PurchaseDate?: string | null
          Quantity?: number | null
          SerialNumber?: string | null
          Status?: string | null
          StorageLocationID?: string | null
          updatedAt: string
        }
        Update: {
          AssetID?: string
          AssetName?: string | null
          AssetTag?: string | null
          AssetType?: string | null
          Brand?: string | null
          Condition?: string | null
          createdAt?: string
          DeviceTag?: string | null
          Location?: string | null
          Model?: string | null
          ModelID?: string | null
          Notes?: string | null
          OperationalState?: string | null
          OwnershipType?: string | null
          ProcurementItemID?: string | null
          PurchaseDate?: string | null
          Quantity?: number | null
          SerialNumber?: string | null
          Status?: string | null
          StorageLocationID?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Asset_ModelID_fkey"
            columns: ["ModelID"]
            isOneToOne: false
            referencedRelation: "AssetModel"
            referencedColumns: ["ModelID"]
          },
          {
            foreignKeyName: "Asset_ProcurementItemID_fkey"
            columns: ["ProcurementItemID"]
            isOneToOne: false
            referencedRelation: "ProcurementItem"
            referencedColumns: ["ItemID"]
          },
          {
            foreignKeyName: "Asset_Status_fkey"
            columns: ["Status"]
            isOneToOne: false
            referencedRelation: "AssetStatus"
            referencedColumns: ["Name"]
          },
          {
            foreignKeyName: "Asset_StorageLocationID_fkey"
            columns: ["StorageLocationID"]
            isOneToOne: false
            referencedRelation: "StorageLocation"
            referencedColumns: ["LocationID"]
          },
        ]
      }
      AssetModel: {
        Row: {
          Category: string
          createdAt: string
          Description: string | null
          EOLDate: string | null
          ImageURL: string | null
          ManufacturerID: string
          ModelID: string
          ModelNumber: string | null
          Name: string
          updatedAt: string
        }
        Insert: {
          Category: string
          createdAt?: string
          Description?: string | null
          EOLDate?: string | null
          ImageURL?: string | null
          ManufacturerID: string
          ModelID: string
          ModelNumber?: string | null
          Name: string
          updatedAt: string
        }
        Update: {
          Category?: string
          createdAt?: string
          Description?: string | null
          EOLDate?: string | null
          ImageURL?: string | null
          ManufacturerID?: string
          ModelID?: string
          ModelNumber?: string | null
          Name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "AssetModel_ManufacturerID_fkey"
            columns: ["ManufacturerID"]
            isOneToOne: false
            referencedRelation: "Manufacturer"
            referencedColumns: ["ManufacturerID"]
          },
        ]
      }
      AssetPhoto: {
        Row: {
          AssetID: string
          Category: string
          createdAt: string
          PhotoID: string
          UploadedBy: string | null
          URL: string
        }
        Insert: {
          AssetID: string
          Category?: string
          createdAt?: string
          PhotoID: string
          UploadedBy?: string | null
          URL: string
        }
        Update: {
          AssetID?: string
          Category?: string
          createdAt?: string
          PhotoID?: string
          UploadedBy?: string | null
          URL?: string
        }
        Relationships: [
          {
            foreignKeyName: "AssetPhoto_AssetID_fkey"
            columns: ["AssetID"]
            isOneToOne: false
            referencedRelation: "Asset"
            referencedColumns: ["AssetID"]
          },
        ]
      }
      AssetRequest: {
        Row: {
          createdAt: string
          Email: string
          FirstName: string
          LastName: string
          Notes: string | null
          RequestedDate: string
          RequestID: string
          RequestType: string
          Status: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          Email: string
          FirstName: string
          LastName: string
          Notes?: string | null
          RequestedDate: string
          RequestID: string
          RequestType: string
          Status?: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          Email?: string
          FirstName?: string
          LastName?: string
          Notes?: string | null
          RequestedDate?: string
          RequestID?: string
          RequestType?: string
          Status?: string
          updatedAt?: string
        }
        Relationships: []
      }
      AssetStatus: {
        Row: {
          Color: string | null
          Description: string | null
          Name: string
        }
        Insert: {
          Color?: string | null
          Description?: string | null
          Name: string
        }
        Update: {
          Color?: string | null
          Description?: string | null
          Name?: string
        }
        Relationships: []
      }
      AssetType: {
        Row: {
          createdAt: string
          Name: string
          OwnershipType: string
          TypeID: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          Name: string
          OwnershipType?: string
          TypeID: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          Name?: string
          OwnershipType?: string
          TypeID?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Assignment: {
        Row: {
          ActualReturnDate: string | null
          AssetID: string
          AssignedByUserID: string | null
          AssignedDate: string
          AssignmentID: string
          createdAt: string
          EmployeeID: string
          ExpectedReturnDate: string | null
          Notes: string | null
          Status: string
          updatedAt: string
        }
        Insert: {
          ActualReturnDate?: string | null
          AssetID: string
          AssignedByUserID?: string | null
          AssignedDate?: string
          AssignmentID: string
          createdAt?: string
          EmployeeID: string
          ExpectedReturnDate?: string | null
          Notes?: string | null
          Status: string
          updatedAt: string
        }
        Update: {
          ActualReturnDate?: string | null
          AssetID?: string
          AssignedByUserID?: string | null
          AssignedDate?: string
          AssignmentID?: string
          createdAt?: string
          EmployeeID?: string
          ExpectedReturnDate?: string | null
          Notes?: string | null
          Status?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Assignment_AssetID_fkey"
            columns: ["AssetID"]
            isOneToOne: false
            referencedRelation: "Asset"
            referencedColumns: ["AssetID"]
          },
          {
            foreignKeyName: "Assignment_AssignedByUserID_fkey"
            columns: ["AssignedByUserID"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
          {
            foreignKeyName: "Assignment_EmployeeID_fkey"
            columns: ["EmployeeID"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["EmployeeID"]
          },
        ]
      }
      AuditLog: {
        Row: {
          Action: string
          AssetID: string
          Details: string | null
          LogID: string
          Timestamp: string
          UserID: string | null
        }
        Insert: {
          Action: string
          AssetID: string
          Details?: string | null
          LogID: string
          Timestamp?: string
          UserID?: string | null
        }
        Update: {
          Action?: string
          AssetID?: string
          Details?: string | null
          LogID?: string
          Timestamp?: string
          UserID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_AssetID_fkey"
            columns: ["AssetID"]
            isOneToOne: false
            referencedRelation: "Asset"
            referencedColumns: ["AssetID"]
          },
          {
            foreignKeyName: "AuditLog_UserID_fkey"
            columns: ["UserID"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
        ]
      }
      department: {
        Row: {
          createdat: string
          departmentid: string
          name: string
          updatedat: string
        }
        Insert: {
          createdat?: string
          departmentid?: string
          name: string
          updatedat?: string
        }
        Update: {
          createdat?: string
          departmentid?: string
          name?: string
          updatedat?: string
        }
        Relationships: []
      }
      distribution_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      Employee: {
        Row: {
          createdAt: string
          Department: string
          Email: string
          EmployeeID: string
          EndDate: string | null
          FirstName: string
          LastName: string
          Slug: string | null
          StartDate: string
          Status: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          Department: string
          Email: string
          EmployeeID: string
          EndDate?: string | null
          FirstName: string
          LastName: string
          Slug?: string | null
          StartDate: string
          Status?: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          Department?: string
          Email?: string
          EmployeeID?: string
          EndDate?: string | null
          FirstName?: string
          LastName?: string
          Slug?: string | null
          StartDate?: string
          Status?: string
          updatedAt?: string
        }
        Relationships: []
      }
      hardware_additional_items: {
        Row: {
          business_justification: string | null
          created_at: string | null
          hardware_request_id: string
          id: string
          item_description: string
        }
        Insert: {
          business_justification?: string | null
          created_at?: string | null
          hardware_request_id: string
          id?: string
          item_description: string
        }
        Update: {
          business_justification?: string | null
          created_at?: string | null
          hardware_request_id?: string
          id?: string
          item_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_additional_items_hardware_request_id_fkey"
            columns: ["hardware_request_id"]
            isOneToOne: false
            referencedRelation: "hardware_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_requests: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          onboarding_request_id: string | null
          request_type: string
          requested_by: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          onboarding_request_id?: string | null
          request_type?: string
          requested_by: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          onboarding_request_id?: string | null
          request_type?: string
          requested_by?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["EmployeeID"]
          },
          {
            foreignKeyName: "hardware_requests_onboarding_request_id_fkey"
            columns: ["onboarding_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_standard_items: {
        Row: {
          created_at: string | null
          hardware_request_id: string
          id: string
          is_requested: boolean
          item_category: string
          item_name: string
        }
        Insert: {
          created_at?: string | null
          hardware_request_id: string
          id?: string
          is_requested?: boolean
          item_category: string
          item_name: string
        }
        Update: {
          created_at?: string | null
          hardware_request_id?: string
          id?: string
          is_requested?: boolean
          item_category?: string
          item_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_standard_items_hardware_request_id_fkey"
            columns: ["hardware_request_id"]
            isOneToOne: false
            referencedRelation: "hardware_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      Manufacturer: {
        Row: {
          createdAt: string
          ManufacturerID: string
          Name: string
          SupportEmail: string | null
          SupportPhone: string | null
          updatedAt: string
          Website: string | null
        }
        Insert: {
          createdAt?: string
          ManufacturerID: string
          Name: string
          SupportEmail?: string | null
          SupportPhone?: string | null
          updatedAt: string
          Website?: string | null
        }
        Update: {
          createdAt?: string
          ManufacturerID?: string
          Name?: string
          SupportEmail?: string | null
          SupportPhone?: string | null
          updatedAt?: string
          Website?: string | null
        }
        Relationships: []
      }
      ModelRelationship: {
        Row: {
          ChildModelID: string
          ParentModelID: string
          RelationshipID: string
          Type: string
        }
        Insert: {
          ChildModelID: string
          ParentModelID: string
          RelationshipID: string
          Type: string
        }
        Update: {
          ChildModelID?: string
          ParentModelID?: string
          RelationshipID?: string
          Type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ModelRelationship_ChildModelID_fkey"
            columns: ["ChildModelID"]
            isOneToOne: false
            referencedRelation: "AssetModel"
            referencedColumns: ["ModelID"]
          },
          {
            foreignKeyName: "ModelRelationship_ParentModelID_fkey"
            columns: ["ParentModelID"]
            isOneToOne: false
            referencedRelation: "AssetModel"
            referencedColumns: ["ModelID"]
          },
        ]
      }
      OffboardingAudit: {
        Row: {
          Action: string
          AuditID: string
          ChecklistID: string
          IPAddress: string | null
          Timestamp: string
          UserID: string | null
        }
        Insert: {
          Action: string
          AuditID: string
          ChecklistID: string
          IPAddress?: string | null
          Timestamp?: string
          UserID?: string | null
        }
        Update: {
          Action?: string
          AuditID?: string
          ChecklistID?: string
          IPAddress?: string | null
          Timestamp?: string
          UserID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OffboardingAudit_ChecklistID_fkey"
            columns: ["ChecklistID"]
            isOneToOne: false
            referencedRelation: "OffboardingChecklist"
            referencedColumns: ["ChecklistID"]
          },
          {
            foreignKeyName: "OffboardingAudit_UserID_fkey"
            columns: ["UserID"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
        ]
      }
      OffboardingChecklist: {
        Row: {
          ChecklistData: Json | null
          ChecklistID: string
          createdAt: string
          CreatedBy: string | null
          EmployeeID: string
          ExitDate: string
          Language: string
          Status: string
          updatedAt: string
        }
        Insert: {
          ChecklistData?: Json | null
          ChecklistID: string
          createdAt?: string
          CreatedBy?: string | null
          EmployeeID: string
          ExitDate: string
          Language?: string
          Status?: string
          updatedAt: string
        }
        Update: {
          ChecklistData?: Json | null
          ChecklistID?: string
          createdAt?: string
          CreatedBy?: string | null
          EmployeeID?: string
          ExitDate?: string
          Language?: string
          Status?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "OffboardingChecklist_EmployeeID_fkey"
            columns: ["EmployeeID"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["EmployeeID"]
          },
        ]
      }
      OffboardingToken: {
        Row: {
          ChecklistID: string
          createdAt: string
          ExpiresAt: string
          Token: string
          TokenID: string
          Used: boolean
        }
        Insert: {
          ChecklistID: string
          createdAt?: string
          ExpiresAt: string
          Token: string
          TokenID: string
          Used?: boolean
        }
        Update: {
          ChecklistID?: string
          createdAt?: string
          ExpiresAt?: string
          Token?: string
          TokenID?: string
          Used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "OffboardingToken_ChecklistID_fkey"
            columns: ["ChecklistID"]
            isOneToOne: false
            referencedRelation: "OffboardingChecklist"
            referencedColumns: ["ChecklistID"]
          },
        ]
      }
      onboarding_requests: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          include_access: boolean
          include_hardware: boolean
          notes: string | null
          requested_by: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          include_access?: boolean
          include_hardware?: boolean
          notes?: string | null
          requested_by: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          include_access?: boolean
          include_hardware?: boolean
          notes?: string | null
          requested_by?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["EmployeeID"]
          },
        ]
      }
      ProcurementItem: {
        Row: {
          ItemID: string
          ModelID: string
          Quantity: number
          RequestID: string
          UnitPrice: number | null
        }
        Insert: {
          ItemID: string
          ModelID: string
          Quantity: number
          RequestID: string
          UnitPrice?: number | null
        }
        Update: {
          ItemID?: string
          ModelID?: string
          Quantity?: number
          RequestID?: string
          UnitPrice?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ProcurementItem_RequestID_fkey"
            columns: ["RequestID"]
            isOneToOne: false
            referencedRelation: "ProcurementRequest"
            referencedColumns: ["RequestID"]
          },
        ]
      }
      ProcurementRequest: {
        Row: {
          CostCenter: string | null
          createdAt: string
          Currency: string
          ExpectedDate: string | null
          Notes: string | null
          OrderDate: string | null
          ReceivedDate: string | null
          RequesterUserID: string
          RequestID: string
          Status: string
          TotalCost: number | null
          updatedAt: string
          VendorID: string | null
        }
        Insert: {
          CostCenter?: string | null
          createdAt?: string
          Currency?: string
          ExpectedDate?: string | null
          Notes?: string | null
          OrderDate?: string | null
          ReceivedDate?: string | null
          RequesterUserID: string
          RequestID: string
          Status?: string
          TotalCost?: number | null
          updatedAt: string
          VendorID?: string | null
        }
        Update: {
          CostCenter?: string | null
          createdAt?: string
          Currency?: string
          ExpectedDate?: string | null
          Notes?: string | null
          OrderDate?: string | null
          ReceivedDate?: string | null
          RequesterUserID?: string
          RequestID?: string
          Status?: string
          TotalCost?: number | null
          updatedAt?: string
          VendorID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProcurementRequest_VendorID_fkey"
            columns: ["VendorID"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["VendorID"]
          },
        ]
      }
      ScanHistory: {
        Row: {
          AssetID: string | null
          CalculatedStatus: string | null
          Method: string
          Outcome: string
          Query: string | null
          ScanID: string
          ScannedAt: string
          ScannedByUserID: string | null
        }
        Insert: {
          AssetID?: string | null
          CalculatedStatus?: string | null
          Method: string
          Outcome: string
          Query?: string | null
          ScanID: string
          ScannedAt?: string
          ScannedByUserID?: string | null
        }
        Update: {
          AssetID?: string | null
          CalculatedStatus?: string | null
          Method?: string
          Outcome?: string
          Query?: string | null
          ScanID?: string
          ScannedAt?: string
          ScannedByUserID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ScanHistory_AssetID_fkey"
            columns: ["AssetID"]
            isOneToOne: false
            referencedRelation: "Asset"
            referencedColumns: ["AssetID"]
          },
          {
            foreignKeyName: "ScanHistory_ScannedByUserID_fkey"
            columns: ["ScannedByUserID"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UserID"]
          },
        ]
      }
      StorageLocation: {
        Row: {
          cachedPath: string | null
          createdAt: string
          Description: string | null
          LocationID: string
          Name: string
          ParentLocationID: string | null
          updatedAt: string
        }
        Insert: {
          cachedPath?: string | null
          createdAt?: string
          Description?: string | null
          LocationID: string
          Name: string
          ParentLocationID?: string | null
          updatedAt: string
        }
        Update: {
          cachedPath?: string | null
          createdAt?: string
          Description?: string | null
          LocationID?: string
          Name?: string
          ParentLocationID?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "StorageLocation_ParentLocationID_fkey"
            columns: ["ParentLocationID"]
            isOneToOne: false
            referencedRelation: "StorageLocation"
            referencedColumns: ["LocationID"]
          },
        ]
      }
      User: {
        Row: {
          CreatedAt: string
          Email: string | null
          Password: string
          ResetCode: string | null
          ResetCodeExpiry: string | null
          Role: string
          UpdatedAt: string
          UserID: string
          Username: string
        }
        Insert: {
          CreatedAt?: string
          Email?: string | null
          Password: string
          ResetCode?: string | null
          ResetCodeExpiry?: string | null
          Role?: string
          UpdatedAt: string
          UserID: string
          Username: string
        }
        Update: {
          CreatedAt?: string
          Email?: string | null
          Password?: string
          ResetCode?: string | null
          ResetCodeExpiry?: string | null
          Role?: string
          UpdatedAt?: string
          UserID?: string
          Username?: string
        }
        Relationships: []
      }
      Vendor: {
        Row: {
          Address: string | null
          ContactName: string | null
          ContractEnd: string | null
          ContractStart: string | null
          createdAt: string
          Email: string | null
          Name: string
          Phone: string | null
          updatedAt: string
          VendorID: string
          Website: string | null
        }
        Insert: {
          Address?: string | null
          ContactName?: string | null
          ContractEnd?: string | null
          ContractStart?: string | null
          createdAt?: string
          Email?: string | null
          Name: string
          Phone?: string | null
          updatedAt: string
          VendorID: string
          Website?: string | null
        }
        Update: {
          Address?: string | null
          ContactName?: string | null
          ContractEnd?: string | null
          ContractStart?: string | null
          createdAt?: string
          Email?: string | null
          Name?: string
          Phone?: string | null
          updatedAt?: string
          VendorID?: string
          Website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

