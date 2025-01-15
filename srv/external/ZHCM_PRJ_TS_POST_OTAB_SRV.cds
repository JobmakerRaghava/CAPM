/* checksum : f8f784a8ac19c50f1b8c7d425cac238f */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZHCM_PRJ_TS_POST_OTAB_SRV {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.pageable : 'false'
@sap.addressable : 'false'
@sap.content.version : '1'
entity ZHCM_PRJ_TS_POST_OTAB_SRV.OtabSet {
  @sap.unicode : 'false'
  @sap.label : 'Logical system'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  key LogicalSystem : String(10) not null;
  @sap.unicode : 'false'
  @sap.label : 'Reference Transaction'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  key ReferenceTransaction : String(5) not null;
  @sap.unicode : 'false'
  @sap.label : 'Employee Payroll ID as in EC Payroll (PERNR)'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  key Employeenumber : String(8) not null;
  @sap.unicode : 'false'
  @sap.label : 'Reference Keey'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  key ReferenceKey : String(20) not null;
  @sap.unicode : 'false'
  @sap.label : 'Reversal Indicator - required for cancellation'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Reversed : String(1) not null;
  @sap.unicode : 'false'
  @sap.label : 'End date'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Validitydate : String(10) not null;
  @sap.unicode : 'false'
  @sap.label : 'Wage type code as in EC Payroll'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  WageType : String(4) not null;
  @sap.unicode : 'false'
  @sap.label : 'Rate'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Number : String(20) not null;
  @sap.unicode : 'false'
  @sap.label : 'Time/Measurement Unit'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Time : String(6) not null;
  @sap.unicode : 'false'
  @sap.label : 'Amount'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Amount : String(20) not null;
  @sap.unicode : 'false'
  @sap.label : 'Cost Center'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  CostCenter : String(10) not null;
  @sap.unicode : 'false'
  @sap.label : 'WBS Element'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  WBS : String(24) not null;
  @sap.unicode : 'false'
  @sap.label : 'Internal Order'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  InternalOrder : String(12) not null;
  @sap.unicode : 'false'
  @sap.label : 'Network Number'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  NetworkNumber : String(12) not null;
  @sap.unicode : 'false'
  @sap.label : 'Activity Number'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  ActivityNumber : String(4) not null;
};

