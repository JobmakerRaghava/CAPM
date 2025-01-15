namespace taqa.srv;

using {taqa.db as TaqaDB} from '../db/taqadb/Database';

@cds.query.limit: {
     default: 1000,
     max    : 30000
}
service TaqaDbService @(path: '/taqa-srv') @(impl: '/srv/handlers/taqadb.js') {


     entity OtabSet                  as projection on TaqaDB.OtabSet;

     @cds.query.limit: 30000
     entity TimeSheetDetails         as
          projection on TaqaDB.TimeSheetDetails {
               *
          }
          where
               DELETED = false;


     @cds.query.limit: 30000
     entity Allowance                as
          projection on TaqaDB.Allowance {
               *
          }
          where
               DELETED = false;

     @cds.query.limit: 30000
     entity JobCodeAssignment        as
          projection on TaqaDB.JobCodeAssignment {
               *
          }
          where
               DELETED = false;

     @cds.query.limit: 30000
     entity ApproverTable            as
          projection on TaqaDB.ApproverTable {
               *
          }
          where
               DELETED = false;

     entity ColumnInfo               as
          projection on TaqaDB.ColumnInfo {
               *
          }
          where
               DELETED = false;

     entity RowInfo                  as
          projection on TaqaDB.RowInfo {
               *
          }
          where
               DELETED = false;

     entity TravelDetails            as
          projection on TaqaDB.TravelDetails {
               *
          }
          where
               DELETED = false;

     // entity ClaimDetails             as
     //      projection on TaqaDB.ClaimDetails {
     //           *
     //      }
     //      where
     //           DELETED = false;


     entity PostWage                 as
          projection on TaqaDB.PostWage {
               *
          }

     entity LockTable                as
          projection on TaqaDB.LockTable {
               *
          }
          where
               DELETED = false;

     entity LineManagerApproverTable as
          projection on TaqaDB.LineManagerApproverTable {
               *
          }
          where
               DELETED = false;

      entity ClaimReports               as
          projection on TaqaDB.ClaimReports {
               *
          }
          where
               DELETED = false;

     entity Claims  as 
     projection on TaqaDB.Claims {*}
          where
               DELETED = false;

     entity AccrualLogs  as 
     projection on TaqaDB.AccrualLogs {*}
          where
               DELETED = false;

     entity ClaimsWorkFlow  as 
     projection on TaqaDB.ClaimsWorkFlow {*}
          where
               DELETED = false;          
     

     type TimeSheetDetailTyp {
          ID                     : String;
          AppID                  : String;
          Date                   : String;
          EmployeeID             : String;
          EmployeeName           : String;
          EmpUserEmail           : String;
          Division               : String;
          DivisionDesc           : String;
          Department             : String;
          DepartmentDesc         : String;
          StartDate              : String;
          EndDate                : String;
          Location               : String;
          CostCenter             : String;
          InternalOrder          : String;
          WbsCode                : String;
          JobTitle               : String;
          JobCode                : String;
          OvertimeHours          : String;
          TotalAmount            : String;
          Day                    : String;
          WorkType               : String;
          RegularHours           : String;
          WorkedHours            : String;
          TotalHours             : String;
          Absence                : String;
          Status                 : String;
          Comment                : String;
          Attachment             : String;
          FileName               : String;
          SaleOfHours            : String;
          HourlyRate             : String;
          Religion               : String;
          EmployeeIs             : String;
          PayGrade               : String;
          RotationalLeaveBalance : String;
          CustomerName           : String;
          ExternalCode           : String;
          CompanyCode            : String;
          Workschedule           : String;
          WbsCodeDesc            : String;
          InternalOrderDesc      : String;
          CostCenterDesc         : String;
          LocationDesc           : String;
          ActualStartDate        : String;
          ActualEndDate          : String;
          WbsCodeCode            : String;
          OvertimeType           : String;
          OvertimeTypeDesc       : String;
          ProjectDesc            : String;
          ProjectCode            : String;
          EmpEmailID             : String;
          LeaveAccrualIndicator  : String;
          EditRecordIndicator    : String;
          OvertimeEligibility    : String;
          NorwayOvertime         : String;
          QhseStatus             : String;
          ReturnIndicator        : String;
          Country                : String;
          LeaveCode              : String;
          OperationalIndicator   : String;
          TimeProfile            : String; 
          CompanyCodeDesc        : String;
          DELETED                : Boolean;
          createdAt              : String;
          modifiedAt             : String;
          createdBy              : String;
          modifiedBy             : String;
          CalendarCode          : String;
          TimeAccountExternalCode : String;
          ItsAllowances          : array of AllowanceTyp;
          ItsJobCodes            : array of JobCodeAssignmentType;
          ItsApprover            : array of ApproverTableTyp;

     }

     type TimeSheetDetailUpdateTyp {

          ID                     : String;
          AppID                  : String;
          Date                   : String;
          EmployeeID             : String;
          EmployeeName           : String;
          EmpUserEmail           : String;
          Division               : String;
          DivisionDesc           : String;
          Department             : String;
          DepartmentDesc         : String;
          StartDate              : String;
          EndDate                : String;
          Location               : String;
          CostCenter             : String;
          InternalOrder          : String;
          WbsCode                : String;
          JobTitle               : String;
          JobCode                : String;
          OvertimeHours          : String;
          TotalAmount            : String;
          Day                    : String;
          WorkType               : String;
          RegularHours           : String;
          WorkedHours            : String;
          TotalHours             : String;
          Absence                : String;
          Status                 : String;
          Comment                : String;
          Attachment             : String;
          FileName               : String;
          SaleOfHours            : String;
          HourlyRate             : String;
          Religion               : String;
          EmployeeIs             : String;
          PayGrade               : String;
          RotationalLeaveBalance : String;
          CustomerName           : String;
          ExternalCode           : String;
          CompanyCode            : String;
          Workschedule           : String;
          WbsCodeDesc            : String;
          InternalOrderDesc      : String;
          CostCenterDesc         : String;
          LocationDesc           : String;
          ActualStartDate        : String;
          ActualEndDate          : String;
          WbsCodeCode            : String;
          OvertimeType           : String;
          OvertimeTypeDesc       : String;
          ProjectDesc            : String;
          ProjectCode            : String;
          EmpEmailID             : String;
          LeaveAccrualIndicator  : String;
          EditRecordIndicator    : String;       
          OvertimeEligibility    : String;
          NorwayOvertime         : String;
          QhseStatus             : String;
          ReturnIndicator        : String;
          OperationalIndicator   : String;
          TimeProfile            : String;
          Country                : String;
          LeaveCode              : String;
              CalendarCode          : String;
          CompanyCodeDesc        : String;
          ItsAllowances          : array of AllowanceTypUpdate;
          ItsJobCodes            : array of JobCodeAssignmentType;
          ItsApprover            : array of ApproverTableTyp;

     }

     type JobCodeAssignmentType {

          EmployeeID    : String;
          StartDate     : String;
          EndDate       : String;
          CostCenter    : String;
          InternalOrder : String;
          WbsCode       : String;
          JobCode       : String;
          createdAt     : String;
          modifiedAt    : String;
          createdBy     : String;
          modifiedBy    : String;
          DELETED       : Boolean;
     }

     type AllowanceTyp {
          ID            : String;
          EmployeeID    : String;
          Date          : String;
          AllowanceID   : String;
          CostCenter    : String;
          InternalOrder : String;
          WbsCode       : String;
          AllowanceDesc : String;
          Amount        : String;
          Number        : String;
          ReferenceKey  : String;
          Status        : String;
          Reversed      : String;
          HistoryRecord : String;
          createdAt     : String;
          modifiedAt    : String;
          createdBy     : String;
          modifiedBy    : String;
          DELETED       : Boolean;
     }

     type LockTableType {
          AppID       : String;
          ProjectCode : String;
          Department  : String;
          Lock        : String;
          ProjectDesc : String;
     }

     type AllowanceTypUpdate {
          parent               : {
               __deferred      : {
                    uri        : String;
               };
          };
          __metadata           : {
               type            : String;
               uri             : String;
          };
          parent_ID            : String;
          parent_AppID         : String;
          parent_Date          : String;
          parent_EmployeeID    : String;
          parent_CostCenter    : String;
          parent_InternalOrder : String;
          parent_WbsCode       : String;
          ID                   : String;
          EmployeeID           : String;
          Date                 : String;
          AllowanceID          : String;
          CostCenter           : String;
          InternalOrder        : String;
          WbsCode              : String;
          AllowanceDesc        : String;
          Amount               : String;
          Number               : String;
          ReferenceKey         : String;
          Status               : String;
          Reversed             : String;
          HistoryRecord        : String;
          createdAt            : String;
          modifiedAt           : String;
          createdBy            : String;
          modifiedBy           : String;
          DELETED              : Boolean;
     }

     type ApproverTableTyp {

          ID            : String;
          ProjectCode   : String;
          Date          : String;
          EmployeeID    : String;
          AdminID       : String;
          ProjectDesc   : String;
          ApproverName  : String;
          ApproverEmpID : String;
          Status        : String;
          Levels        : String;
          Comments      : String;
          createdAt     : String;
          modifiedAt    : String;
          createdBy     : String;
          modifiedBy    : String;
          DELETED       : Boolean;

     }


     type WageInput1 {
          REVERSED              : String;
          EMPLOYEENUMBER        : String;
          VALIDITYDATE          : String;
          WAGETYPE              : String;
          NUMBER                : String;
          Time_Measurement_Unit : String;
          AMOUNT                : String;
          Referencekey          : String;
          CostCenter            : String;
          WBS                   : String;
          InternalOrder         : String;
          NetworkNumber         : String;
          ActivityNumber        : String;
          LogicalSystemSource   : String;
          Reference_Transc      : String;
     }

     type WageInput {
          Reversed             : String;
          Employeenumber       : String;
          Validitydate         : String;
          WageType             : String;
          Number               : String;
          Time                 : String;
          Amount               : String;
          ReferenceKey         : String;
          CostCenter           : String;
          WBS                  : String;
          InternalOrder        : String;
          NetworkNumber        : String;
          ActivityNumber       : String;
          LogicalSystem        : String;
          ReferenceTransaction : String;
     }
     type EditNotificationArray{
          Date:String;
         OldWorkType : String;
          NewWorkType : String;
          OldOvertime:String;
          NewOvertime:String;
          AllowanceRemoved:String;
          AllowanceAdded:String;

     }

     action   ApproveTimesheet(parameter : array of TimeSheetDetailTyp)                                                                  returns array of TimeSheetDetailTyp;
     action   PostAllowance(parameter : array of TimeSheetDetailTyp, wageInputs : array of WageInput, lockData : array of LockTableType) returns array of TimeSheetDetailTyp;
     action   MassuploadUpdate(parameter : array of TimeSheetDetailUpdateTyp)                                                            returns array of TimeSheetDetailUpdateTyp;
     action   MassuploadCreate(parameter : array of TimeSheetDetailTyp)                                                                  returns array of TimeSheetDetailTyp;
     action   PostApprovalData(parameter : array of ApproverTableTyp)
                                                                         returns array of ApproverTableTyp;


     action AccrualPosting(payload : array of AccrualLogs) returns String;


     action sendTravelEmail(
        base64pdf: LargeString,
        receiverMail: String(100),
        fileName: String(100),
        name: String(100),
        focalPerson: String(100),
        ticketbook: Boolean,
        
    ) returns String;
    action sendEditNotification ( 
        receiverMail: String(100),
        fileName: String(100),
        name: String(100),
        EditedDate:String(100),
        AdminName:String(100),
        editnotificationdata: array of EditNotificationArray) returns String;
    
     entity AbsenceRecordsFunc       as
          projection on TaqaDB.AbsenceRecordsFunc {
               *
          }

     entity EmployeeEmailAlerts      as
          projection on TimeSheetDetails {
               *
          }

     entity ApproveEmailAlerts       as
          projection on TimeSheetDetails {
               *
          }

     entity MasterDataUpdate         as
          projection on TimeSheetDetails {
               *
          }

     entity ReturnMail               as
          projection on TimeSheetDetails {
               *
          }
     
     entity UpdateAccrual               as
          projection on AccrualLogs {
               *
          }


 entity AccrualEmailNotification               as
          projection on TimeSheetDetails {
               *
          }

entity OpenRecordCreation               as
          projection on TimeSheetDetails {
               *
          }


//  // --------------- new stuff do not disturb ----------------
     entity ApproverHistory {
              parent        : Association to TimeSheetDetails;
              CreatedBy     : String(100) default '';
              CreatedAt     : Date;
          key ID            : UUID;
          key ProjectCode   : String(100) default '';
          key Date          : String(10);
          key EmployeeID    : String(10) default '';
              AdminID       : String(10) default '';
              ProjectDesc   : String(100) default '';
              ApproverName  : String(100) default '';
              ApproverEmpID : String(10) default '';
              Status        : String(80) default '';
              Levels        : String(80) default '';
              Comments      : String(250) default '';
     };

     entity ApprovalStatus           as
          projection on TimeSheetDetails {
               EmployeeID,
               EmployeeName,
               JobTitle,
               Department,
               DepartmentDesc,
               ProjectCode,   
               ProjectDesc,
               Date,
               Status,
               AppID,
               WorkType,
               LeaveCode,
               WbsCode,
               CostCenter, 
               InternalOrder,
               Location,
               Division,
               CompanyCode,
               ReturnIndicator,
               QhseStatus,
               
               
               // Association to ApproverHistory entity
               approverDetails : Association to many ApproverHistory 
                    on approverDetails.EmployeeID = $self.EmployeeID
                         and approverDetails.ProjectCode = $self.ProjectCode
                         and approverDetails.Date = $self.Date
                }
// --------------- new stuff do not disturb end ----------------
     entity GetDuplicate             as
          projection on TimeSheetDetails {
               *
          }

     entity GetDuplicateAllowance    as
          projection on Allowance {
               *
          }

     entity TravelemailAttachment as
          projection on TimeSheetDetails {
               *
          }

     entity TravelMasterDataUpdate   as
          projection on TimeSheetDetails {
               *
          }

     entity ClaimMasterDataUpdate as 
          projection on ClaimReports {
               *
          }

     entity ProcessRecords           as
          projection on TimeSheetDetails {
               *
          }

     action   PostWageFunc(wageInputs : array of WageInput)                                                                              returns array of WageInput;

     @open
     type object {};


     function AbsenceRecordsFunc1()                                                                                                      returns array of {
          REVERSED : String;
          EMPLOYEENUMBER : String;
          VALIDITYDATE : String;
          WAGETYPE : String;
          NUMBER : String;
          Time_Measurement_Unit : String;
          AMOUNT : String;
          Referencekey : String;
          CostCenter : String;
          WBS : String;
          InternalOrder : String;
          NetworkNumber : String;
          ActivityNumber : String;
          LogicalSystemSource : String;
          Reference_Transc : String;
     };
}
