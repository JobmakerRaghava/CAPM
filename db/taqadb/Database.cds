using {
    cuid,
    managed
} from '@sap/cds/common';
using {taqa.util.aspects as localaspects} from '../utils/Aspects';
using {ZHCM_PRJ_TS_POST_OTAB_SRV as external} from '../../srv/external/ZHCM_PRJ_TS_POST_OTAB_SRV';

context taqa.db {

    entity OtabSet as
        projection on external.OtabSet {
            *
        }

    entity TimeSheetDetails : managed, localaspects.common {
        key ID                     : UUID;
        key AppID                  : String(10);
        key Date                   : String(10);
        key EmployeeID             : String(10) default '';
            EmployeeName           : String(80) default '';
            Division               : String(80) default '';
            DivisionDesc           : String(200) default '';
            Department             : String(80) default '';
            DepartmentDesc         : String(200) default '';
            StartDate              : String(10) default '';
            EndDate                : String(10) default '';
            Location               : String(100) default '';
        key CostCenter             : String(100) default '';
        key InternalOrder          : String(100) default '';
        key WbsCode                : String(100) default '';
            JobTitle               : String(200) default '';
            JobCode                : String(80) default '';
            OvertimeHours          : String(10) default '';
            TotalAmount            : String(10) default '';
            Day                    : String(10) default '';
            WorkType               : String(80) default '';
            RegularHours           : String(10) default '';
            WorkedHours            : String(10) default '';
            TotalHours             : String(10) default '';
            Absence                : String(100) default '';
            Status                 : String(50) default '';
            Comment                : String(250) default '';
            Attachment             : String(250) default '';
            FileName               : String(250) default '';
            SaleOfHours            : String(10) default '';
            HourlyRate             : String(10) default '';
            Religion               : String(50) default '';
            EmployeeIs             : String(50) default '';
            PayGrade               : String(10) default '';
            RotationalLeaveBalance : String(10) default '';
            CustomerName           : String(50) default '';
            ExternalCode           : String(80) default '';
            CompanyCode            : String(10) default '';
            Workschedule           : String(50) default '';
            WbsCodeDesc            : String(100) default '';
            InternalOrderDesc      : String(100) default '';
            CostCenterDesc         : String(100) default '';
            LocationDesc           : String(100) default '';
            ActualStartDate        : String(10) default '';
            ActualEndDate          : String(10) default '';
            WbsCodeCode            : String(50) default '';
            OvertimeType           : String(50) default '';
            OvertimeTypeDesc       : String(100) default '';
            ProjectDesc            : String(100) default '';
            ProjectCode            : String(100) default '';
            EmpEmailID             : String(100) default '';
            LeaveAccrualIndicator  : String(2) default '';
            QhseStatus             : String(80) default '';
            ReturnIndicator        : String(10) default '';
            Country                : String(80) default '';
            LeaveCode              : String(80) default '';
            OperationalIndicator   : String(100) default '';
            TimeProfile            : String(100) default '';
            NorwayOvertime         : String(100) default '';
            CompanyCodeDesc        : String(200) default '';
            EditRecordIndicator    : String(5) default '';
            EmpUserEmail           : String(256) default '';
            OvertimeEligibility    : String(10) default '';
            CalendarCode          : String(100) default '';
            TimeAccountExternalCode : String(100) default '';
            VALIDFROM              : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
            VALIDTO                : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
            ItsAllowances          : Composition of many Allowance
                                         on ItsAllowances.parent = $self;
            ItsJobCodes            : Composition of many JobCodeAssignment
                                         on ItsJobCodes.parent = $self;
            ItsApprover            : Composition of many ApproverTable
                                         on ItsApprover.parent = $self;


    }

    entity LockTable : managed, localaspects.common {
        key ID          : UUID;
        key AppID       : String(10);
        key ProjectCode : String(100) default '';
        key Department  : String(80) default '';
            Lock        : String(2) default '';
            ProjectDesc : String(100) default '';
    }


    entity Allowance : managed, localaspects.common {
            parent         : Association to TimeSheetDetails;
        key EmployeeID     : String(10) default '';
        key Date           : String(10);
        key AllowanceID    : String(40) default '';
        key CostCenter     : String(100) default '';
        key InternalOrder  : String(100) default '';
        key WbsCode        : String(100) default '';
            AllowanceDesc  : String(40) default '';
            Amount         : String(40) default '';
            Number         : String(10) default '';
        key ReferenceKey   : String(20) default '';
            Status         : String(30) default '';
        key Reversed       : String(1) default '';
            HistoryRecord  : String(10) default '';
            ErrorIndicator : String(5) default '';
            VALIDFROM      : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
            VALIDTO        : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
    }

    entity JobCodeAssignment : managed, localaspects.common {
            parent        : Association to TimeSheetDetails;
        key EmployeeID    : String(10) default '';
        key StartDate     : String(10) default '';
        key EndDate       : String(10) default '';
        key CostCenter    : String(100) default '';
        key InternalOrder : String(100) default '';
        key WbsCode       : String(100) default '';
            JobCode       : String(100) default '';
    }

    entity ApproverTable : managed, localaspects.common {
            parent        : Association to TimeSheetDetails;
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
    }

    entity LineManagerApproverTable : managed, localaspects.common {
        key ID              : UUID;
            EmployeeID      : String(10) default '';
            EmployeeName    : String(100) default '';
            EmployeeEmailID : String(100) default '';
            ApproverName    : String(100) default '';
            ApproverEmpID   : String(80) default '';
            ApproverEmailID : String(80) default '';
            CompanyCode     : String(10) default '';
            Levels          : String(10) default '';
    }


    entity WorkType : managed, localaspects.common {
        WorkTypeID : String(50) default '';
        WorkDesc   : String(50) default '';
    }

    entity ColumnInfo : managed, localaspects.common {
        key ID        : UUID;
            TableName : String(90) default '';
            Column1   : String(90) default '';
            Column2   : String(90) default '';
            Column3   : String(90) default '';
            Column4   : String(90) default '';
            Column5   : String(90) default '';
            Column6   : String(90) default '';
            Column7   : String(90) default '';
            Column8   : String(90) default '';
            Column9   : String(90) default '';
            Column10  : String(90) default '';
            Column11  : String(90) default '';
            Column12  : String(90) default '';
            Column13  : String(90) default '';
            Column14  : String(90) default '';
            Column15  : String(90) default '';
            Column16  : String(90) default '';
            Column17  : String(90) default '';
            Column18  : String(90) default '';
    }

    entity RowInfo : managed, localaspects.common {
        key ID        : UUID;
            TableName : String(90) default '';
            Column1   : String(90) default '';
            Column2   : String(90) default '';
            Column3   : String(90) default '';
            Column4   : String(90) default '';
            Column5   : String(90) default '';
            Column6   : String(90) default '';
            Column7   : String(90) default '';
            Column8   : String(90) default '';
            Column9   : String(90) default '';
            Column10  : String(90) default '';
            Column11  : String(90) default '';
            Column12  : String(90) default '';
            Column13  : String(90) default '';
            Column14  : String(90) default '';
            Column15  : String(90) default '';
            Column16  : String(90) default '';
            Column17  : String(90) default '';
            Column18  : String(90) default '';
    }

    // entity TravelDetails : managed, localaspects.common {
    //     key ID                   : UUID;
    //         EmployeeID           : String(40) default '';
    //         EmployeeFirstName    : String(80) default '';
    //         EmployeeMiddleName   : String(80) default '';
    //         EmployeeLastName     : String(80) default '';
    //         Gender               : String(40) default '';
    //         Position             : String(40) default '';
    //         LeaveSchedule        : String(40) default '';
    //         CompanyCode          : String(40) default '';
    //         HomeCountry          : String(40) default '';
    //         Deparment            : String(40) default '';
    //         Division             : String(40) default '';
    //         Function             : String(40) default '';
    //         DateOfBirth          : String(40) default '';
    //         ContactNo            : String(40) default '';
    //         ReportingManager     : String(40) default '';
    //         FocalPerson          : String(40) default '';
    //         Class                : String(40) default '';
    //         CodeDiv              : String(40) default '';
    //         ExpenseCode          : String(40) default '';
    //         ProjectCode          : String(40) default '';
    //         Designation          : String(40) default '';
    //         Age                  : String(40) default '';
    //         Region               : String(40) default '';
    //         BusStartDate         : String(40) default '';
    //         BusEndDate           : String(40) default '';
    //         Hotel                : String(40) default '';
    //         ExitReEntry          : String(40) default '';
    //         TrainingStartDate    : String(40) default '';
    //         TrainingEndDate      : String(40) default '';
    //         Email                : String(40) default '';
    //         ReferenceNo          : String(40) default '';
    //         TicketCount          : String(40) default '';
    //         PrevFareAmt          : String(40) default '';
    //         JobDetails           : String(40) default '';
    //         Location             : String(40) default '';
    //         Grade                : String(40) default '';
    //         TravelId             : String(40) default '';
    //         TravelType           : String(40) default '';
    //         Status               : String(40) default '';
    //         ReissuranceRefNo     : String(40) default '';
    //         OverseasMobileNumber : String(20) default '';
    //         AgentDescription     : String(100) default '';
    //         AgentCode            : String(20) default '';
    //         ItsTraveller         : Composition of many TravellerDetails
    //                                    on ItsTraveller.parent = $self;
    //         ItsTicketDetails     : Composition of many TravelTicketDetails
    //                                    on ItsTicketDetails.parent = $self;
    // }

    entity TravelDetails : managed, localaspects.common {
        key ID                       : UUID;
            EffectiveStartDate       : String(80) default '';
            TransactionSequence      : String(80) default '';
            TravelCategory           : String(80) default '';
            TravelCategoryTQ         : String(80) default '';
            LegalEntity              : String(80) default '';
            EXTCode                  : String(80) default '';
            TravelType               : String(80) default '';
            TravelAgentName          : String(100) default '';
            TravelAgentCode          : String(20) default '';
            PurposeofTravel          : String(345) default '';
            VisaRequirement          : String(80) default '';
            Transportation           : String(80) default '';
            Hotel                    : String(80) default '';
            MobileNo                 : String(80) default '';
            TypeofTravel             : String(80) default '';
            DestinationCountry       : String(80) default '';
            DepartureDate            : String(80) default '';
            DepartureSector          : String(80) default '';
            DepartureAirportCity     : String(80) default '';
            DepartureTime            : String(80) default '';
            ReturnDate               : String(80) default '';
            ReturnSector             : String(80) default '';
            ReturnTime               : String(80) default '';
            JobStartDate             : String(80) default '';
            JobEndDate               : String(80) default '';
            FrequentFlyerNo          : String(80) default '';
            Region                   : String(80) default '';
            Exit                     : String(80) default '';
            ExitDuration             : String(80) default '';
            BusinessStartDate        : String(80) default '';
            BusinessEndDate          : String(80) default '';
            TrainingStartDate        : String(80) default '';
            TrainingEndDate          : String(80) default '';
            NationalID               : String(80) default '';
            EmployeeID               : String(80) default '';
            EmployeeName             : String(80) default '';
            Designation              : String(80) default '';
            Department               : String(80) default '';
            CostCentre               : String(80) default '';
            Nationality              : String(80) default '';
            ExpenseCode              : String(80) default '';
            ProjectCode              : String(80) default '';
            HomeCountry              : String(80) default '';
            AnnualLeaveStartDate     : String(80) default '';
            AnnualLeaveEndDate       : String(80) default '';
            RotationalLeaveStartDate : String(80) default '';
            RotationalLeaveEndDate   : String(80) default '';
            WBS                      : String(80) default '';
            WbsCodeDesc              : String(80) default '';
            InternalOrder            : String(80) default '';
            InternalOrderDesc        : String(80) default '';
            LegalEntityDesc          : String(80) default '';
            LeaveSchedule            : String(80) default '';
            PersonalCost             : String(80) default '';
            TrfNumber                : String(80) default '';
            ReferenceNumber          : String(80) default '';
            ChildExternalCode        : String(80) default '';
            ParentExternalCode       : String(80) default '';
            BookingType              : String(80) default '';
            JobTitle                 : String(80) default '';
            CompanyCode              : String(80) default '';
            CompanyName              : String(80) default '';
            TravelwithFamily         : String(80) default '';
            NumberOfDependents       : String(80) default '';
            Function                 : String(80) default '';
            DepartmentName           : String(80) default '';
            DepartmentCode           : String(80) default '';
            Division                 : String(80) default '';
            LocationGroup            : String(80) default '';
            Location                 : String(80) default '';
            CreationDate             : String(80) default '';
            FocalPersonName          : String(80) default '';
            Class                    : String(80) default '';
            SectorTicket             : String(80) default '';
            Airlines                 : String(80) default '';
            TicketNumber             : String(80) default '';
            BaseAmount               : String(80) default '';
            TaxAmount                : String(80) default '';
            Gst                      : String(80) default '';
            Amount                   : String(80) default '';
            Currency                 : String(80) default '';
            AgentCode                : String(80) default '';
            AgentDescription         : String(100) default '';
            ContactNumber            : String(80) default '';
            Remarks                  : String(80) default '';
            EmailId                  : String(80) default '';
            PassportNumber           : String(80) default '';
            AgentStatus              : String(80) default '';
            Status                   : String(80) default '';
            SeatPreference           : String(80) default '';
            MealPreference           : String(80) default '';
            EmpFirstName             : String(80) default '';
            EmpMiddleName            : String(80) default '';
            EmpLastName              : String(80) default '';
            EmpTitle                 : String(80) default '';
            Attachment               : String(250) default '';
            FileName                 : String(80) default '';
            CodeDiv                  : String(80) default '';
            OverseasMobNo            : String(80) default '';
            AirportCity              : String(80) default '';
            HomeAirportCity          : String(80) default '';
            Age                      : String(80) default '';
            TravelDetails            : String(80) default '';
            TravelCountry            : String(80) default '';
            TravelDate               : String(80) default '';
            DateOfBirth              : String(20) default '';
            ItsFamilyDetails         : Composition of many TravelFamilyDetails
                                           on ItsFamilyDetails.parent = $self;
            ItsTicketDetails         : Composition of many TravelTicketDetails
                                           on ItsTicketDetails.parent = $self;

            FileID                   : String(50) default '';
            // MimeType                 : String(256) default '' @Core.IsMediaType;
            // FileContent              : LargeBinary @Core.MediaType: MimeType;
            DocName                  : String(256) default '';
    }

    entity TravelFamilyDetails : managed, localaspects.common {
            parent       : Association to TravelDetails;
        key ID           : UUID;
            ExternalCode : String(100) default '';
            FirstName    : String(100) default '';
            MiddleName   : String(100) default '';
            LastName     : String(100) default '';
            Title        : String(100) default '';
            Relationship : String(100) default '';
            DateOfBirth  : String(100) default '';

    }

    entity TravelTicketDetails : managed, localaspects.common {
            parent       : Association to TravelDetails;
        key ID           : UUID;
            Airline      : String(80) default '';
            SectorTicket : String(80) default '';
            TravelDate   : String(15) default '';
            TicketNumber : String(80) default '';
            Sector       : String(250) default '';
            BaseAmount   : String(20) default '';
            TaxAmount    : String(80) default '';
            Currency     : String(10) default '';
            Amount       : String(100) default '';
            Gst          : String(80) default '';
    }


    entity TravellerDetails : managed, localaspects.common {
            parent              : Association to TravelDetails;
        key ID                  : UUID;
            EmployeeID          : String(40) default '';
            RelationName        : String(80) default '';
            Relationship        : String(80) default '';
            Phone               : String(20) default '';
            DateOfBirth         : String(10) default '';
            TravelDetails       : String(80) default '';
            DepartureDate       : String(10) default '';
            DepartureSector     : String(80) default '';
            DepartureTime       : String(80) default '';
            ReturnDate          : String(80) default '';
            TravelCountry       : String(80) default '';
            AirportCity         : String(80) default '';
            ReasonForTravel     : String(80) default '';
            LocalModbileNumber  : String(80) default '';
            SeatPreference      : String(40) default '';
            MealPreference      : String(40) default '';
            VisaRequirement     : String(40) default '';
            FrequentFlyerNumber : String(40) default '';
            Transportation      : String(40) default '';
            ReturnSector        : String(80) default '';
            ReturnTime          : String(80) default '';
            Attachment          : String(250) default '';
            FileName            : String(100) default '';
    }


    // entity ClaimDetails : managed, localaspects.common {
    //     key ID            : UUID;
    //         EmployeeID    : String(10) default '';
    //         EmployeeName  : String(100) default '';
    //         ExpenseID     : String(80) default '';
    //         ExpenseName   : String(80) default '';
    //         ClaimID       : String(40) default '';
    //         ClaimName     : String(80) default '';
    //         Description   : String(200) default '';
    //         Date          : String(10) default '';
    //         TotalAmount   : String(40) default '';
    //         Status        : String(80) default '';
    //         ClaimType     : String(40) default '';
    //         Department    : String(100) default '';
    //         ItsClaimItems : Composition of many ClaimItemDetails
    //                             on ItsClaimItems.parent = $self;

    // }


    // entity ClaimItemDetails : managed, localaspects.common {
    //     key ID                   : UUID;
    //         EmployeeID           : String(10) default '';
    //         ClaimID              : String(40) default '';
    //         Date                 : String(10) default '';
    //         CostCenter           : String(100) default '';
    //         WbsCode              : String(20) default '';
    //         InternalOrder        : String(100) default '';
    //         Amount               : String(100) default '';
    //         InvoiceNumber        : String(40) default '';
    //         Attachment           : String(40) default '';
    //         Description          : String(200) default '';
    //         Nationality          : String(40) default '';
    //         FromDate             : String(40) default '';
    //         EndDate              : String(40) default '';
    //         Purpose              : String(40) default '';
    //         Institution          : String(40) default '';
    //         Location             : String(40) default '';
    //         Justification        : String(40) default '';
    //         Name                 : String(40) default '';
    //         DateOfBirth          : String(40) default '';
    //         RelationType         : String(40) default '';
    //         VisaType             : String(40) default '';
    //         VisaValidity         : String(40) default '';
    //         VisaAmount           : String(40) default '';
    //         DependentCount       : String(40) default '';
    //         Remarks              : String(40) default '';
    //         EmployeeComment      : String(40) default '';
    //         ChildGrade           : String(40) default '';
    //         ChildAge             : String(40) default '';
    //         SchoolName           : String(80) default '';
    //         TermOfClaim          : String(40) default '';
    //         VisaExpenseType      : String(40) default '';
    //         TravelReason         : String(40) default '';
    //         TravelDestination    : String(40) default '';
    //         TravelType           : String(40) default '';
    //         AdvanceType          : String(40) default '';
    //         DeductionType        : String(40) default '';
    //         LoanNumber           : String(40) default '';
    //         NumberOfInstallments : String(40) default '';
    //         TripNumber           : String(40) default '';
    //         DependentName        : String(100) default '';
    //         parent               : Association to ClaimDetails;
    // }

    entity ClaimReports : managed, localaspects.common {
        key ClaimId            : String(100) default '';
            Status             : String(100) default '';
            Approver           : String(100) default '';
            EmployeeNumber     : String(100) default '';
            EmployeeName       : String(100) default '';
            BenefitCode        : String(100) default '';
            ProcessDescription : String(100) default '';
            ESRCreatedDate     : String(100) default '';
            CompanyCode        : String(100) default '';
            CompanyDescription : String(100) default '';
            JobTitle           : String(100) default '';
            Function           : String(100) default '';
            Department         : String(100) default '';
            Division           : String(100) default '';
            LocationGroup      : String(100) default '';
            Currency           : String(100) default '';
            CostCentre         : String(100) default '';
            CostCenterDesc     : String(100) default '';
            WorkflowDateTime   : String(100) default '';
            CurrentLevel       : String(100) default '';

            ItsClaims          : Composition of many Claims
                                     on ItsClaims.parent = $self;
            ClaimsWorkFlowData : Composition of many ClaimsWorkFlow
                                     on ClaimsWorkFlowData.parent = $self;

    }

    entity ClaimsWorkFlow : managed, localaspects.common {
            parent               : Association to ClaimReports;
        key ID                   : UUID;
            Status               : String(100) default '';
            Level                : String(100) default '';
            ApproverName         : String(100) default '';
            LastModifiedDateTime : String(100) default '';

    }

    entity AccrualLogs : managed, localaspects.common {
        key ID                         : UUID;
            ExternalCode               : String(100) default '';
            EmployeeID                 : String(100) default '';
            TimeAccountExternalCode    : String(100) default '';
            BookingUnit                : String(100) default '';
            ReferenceObject            : String(100) default '';
            BookingType                : String(100) default '';
            BookingDate                : String(100) default '';
            EmployeeTime               : String(100) default '';
            BookingAmount              : String(100) default '';
            Comment                    : String(100) default '';
            Status                     : String(100) default '';

    }


    entity Claims : managed, localaspects.common {
            parent              : Association to ClaimReports;
        key ID                  : UUID;
            AssignmentNumber    : String(100) default '';

            @Core.MediaType  : AttachmentType
            Attachment          : LargeBinary;

            @Core.IsMediaType: true
            AttachmentType      : String(256) default '';

            BenefitSubtype      : String(100) default '';
            EducationAssistance : String(100) default '';
            WageDescription     : String(100) default '';
            Description         : String(500) default '';
            Amount              : String(100) default '';
            WageType            : String(100) default '';
            AcademicStartDate   : String(100) default '';
            AcademicEndDate     : String(100) default '';
            AgeofChild          : String(100) default '';
            NameofChild         : String(100) default '';
            GradeofChild        : String(100) default '';
            Comments            : String(500) default '';
            Location            : String(100) default '';
            SchoolName          : String(100) default '';
            TermofClaim         : String(100) default '';
            DOBofChild          : String(100) default '';


    }

    @cds.persistence.skip
    entity PostWage {
        REVERSED              : String(40) default '';
        EMPLOYEENUMBER        : String(10) default '';
        VALIDITYDATE          : String(10) default '';
        WAGETYPE              : String(10) default '';
        NUMBER                : String(20) default '';
        Time_Measurement_Unit : String(10) default '';
        AMOUNT                : String(10) default '';
        Referencekey          : String(20) default '';
        CostCenter            : String(100) default '';
        WBS                   : String(100) default '';
        InternalOrder         : String(100) default '';
        NetworkNumber         : String(100) default '';
        ActivityNumber        : String(80) default '';
        LogicalSystemSource   : String(80) default '';
        Reference_Transc      : String(80) default '';
    }

    @cds.persistence.skip
    entity AbsenceRecordsFunc {
        REVERSED              : String(40) default '';
        EMPLOYEENUMBER        : String(10) default '';
        VALIDITYDATE          : String(10) default '';
        WAGETYPE              : String(10) default '';
        NUMBER                : String(20) default '';
        Time_Measurement_Unit : String(10) default '';
        AMOUNT                : String(10) default '';
        Referencekey          : String(20) default '';
        CostCenter            : String(100) default '';
        WBS                   : String(100) default '';
        InternalOrder         : String(100) default '';
        NetworkNumber         : String(100) default '';
        ActivityNumber        : String(80) default '';
        LogicalSystemSource   : String(80) default '';
        Reference_Transc      : String(80) default '';
    }

    // History Tables

    entity TimeSheetDetails_History : managed, localaspects.common {
        ID                     : UUID;
        AppID                  : String(10);
        Date                   : String(10);
        EmployeeID             : String(10) default '';
        EmployeeName           : String(80) default '';
        Division               : String(80) default '';
        DivisionDesc           : String(200) default '';
        Department             : String(80) default '';
        DepartmentDesc         : String(200) default '';
        StartDate              : String(10) default '';
        EndDate                : String(10) default '';
        Location               : String(100) default '';
        CostCenter             : String(100) default '';
        InternalOrder          : String(100) default '';
        WbsCode                : String(100) default '';
        JobTitle               : String(200) default '';
        JobCode                : String(80) default '';
        OvertimeHours          : String(10) default '';
        TotalAmount            : String(10) default '';
        Day                    : String(10) default '';
        WorkType               : String(80) default '';
        RegularHours           : String(10) default '';
        WorkedHours            : String(10) default '';
        TotalHours             : String(10) default '';
        Absence                : String(100) default '';
        Status                 : String(50) default '';
        Comment                : String(250) default '';
        Attachment             : String(250) default '';
        FileName               : String(250) default '';
        SaleOfHours            : String(10) default '';
        HourlyRate             : String(10) default '';
        Religion               : String(50) default '';
        EmployeeIs             : String(50) default '';
        PayGrade               : String(10) default '';
        RotationalLeaveBalance : String(10) default '';
        CustomerName           : String(50) default '';
        ExternalCode           : String(80) default '';
        CompanyCode            : String(10) default '';
        Workschedule           : String(50) default '';
        WbsCodeDesc            : String(100) default '';
        InternalOrderDesc      : String(100) default '';
        CostCenterDesc         : String(100) default '';
        LocationDesc           : String(100) default '';
        ActualStartDate        : String(10) default '';
        ActualEndDate          : String(10) default '';
        WbsCodeCode            : String(50) default '';
        OvertimeType           : String(50) default '';
        OvertimeTypeDesc       : String(100) default '';
        ProjectDesc            : String(100) default '';
        ProjectCode            : String(100) default '';
        EmpEmailID             : String(100) default '';
        LeaveAccrualIndicator  : String(2) default '';
        QhseStatus             : String(80) default '';
        ReturnIndicator        : String(10) default '';
        Country                : String(80) default '';
        LeaveCode              : String(80) default '';
        OperationalIndicator   : String(100) default '';
        TimeProfile            : String(100) default '';
        NorwayOvertime         : String(100) default '';
        CompanyCodeDesc        : String(200) default '';
        EditRecordIndicator    : String(5) default '';
        EmpUserEmail           : String(256) default '';
        OvertimeEligibility    : String(10) default '';
        TimeAccountExternalCode : String(100) default '';
        CalendarCode          : String(100) default '';
        VALIDFROM              : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
        VALIDTO                : Timestamp not null  @cds.api.ignore  @assert.notNull: false;

    }

    entity Allowance_History : managed, localaspects.common {
        parent_ID            : String(36) default '';
        parent_AppID         : String(10) default '';
        parent_Date          : String(10) default '';
        parent_EmployeeID    : String(10) default '';
        parent_CostCenter    : String(100) default '';
        parent_InternalOrder : String(100) default '';
        parent_WbsCode       : String(100) default '';
        EmployeeID           : String(10) default '';
        Date                 : String(10);
        AllowanceID          : String(40) default '';
        CostCenter           : String(100) default '';
        InternalOrder        : String(100) default '';
        WbsCode              : String(100) default '';
        AllowanceDesc        : String(40) default '';
        Amount               : String(40) default '';
        Number               : String(10) default '';
        ReferenceKey         : String(20) default '';
        Status               : String(30) default '';
        Reversed             : String(1) default '';
        HistoryRecord        : String(10) default '';
        ErrorIndicator       : String(5) default '';
        VALIDFROM            : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
        VALIDTO              : Timestamp not null  @cds.api.ignore  @assert.notNull: false;
    }


}
