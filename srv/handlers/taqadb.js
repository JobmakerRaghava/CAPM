const cds = require("@sap/cds");

const SequenceUtil = require('../utils/seq/SequenceUtil');
const { default: axios } = require("axios");
const { response } = require("express");
const { update } = require("@sap/cds/libx/_runtime/hana/execute");
const { before } = require("node:test");

//email imports

const fs = require('fs');
const nodemailer = require('nodemailer');
// const XLSX = require('xlsx');
const { chdir, off } = require("process");
const { assert } = require("console");
const { url } = require("inspector");
const exp = require("constants");


module.exports = cds.service.impl(async function () {


  const db = await cds.connect.to("db");
  var seqConfigPath = __dirname + '/EntitySequenceMapping.json';
  //console.log("Config path:" + seqConfigPath);
  const seqUtil = new SequenceUtil(db, this, seqConfigPath);
  await seqUtil.validate();

  this.on('ApproveTimesheet', async (req, next) => {
    let srv = cds.services['taqa.srv.TaqaDbService'];
    var data = req.data.parameter;

    console.log("empid:" + data[0].EmployeeID);


    const {
      TimeSheetDetails
    } = cds.entities('taqa.srv.TaqaDbService');

    try {

      const promises = [];

      console.log("emp length:" + data.length);
      for (const item of data) {
        //const id = item.ID;
        console.log("emp status:" + JSON.stringify(item));

        // code change on 17.10 - commented the condition : Anto : start

        // if (item.QhseStatus === "Approved") {

        //   await UPDATE(TimeSheetDetails).set({
        //     QhseStatus: item.QhseStatus
        //   }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });

        // } else {
        //   await UPDATE(TimeSheetDetails).set({
        //     Status: item.Status
        //   }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });

        // }

        await UPDATE(TimeSheetDetails).set({
          QhseStatus: item.QhseStatus,
          Status: item.Status
        }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });

        // code change on 17.10 - commented the condition : Anto : end

      }
      // const results = await Promise.all(promises);
      //return results;
      console.log("update of approval records completed")
      return { message: 'Update Successful' };
      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while updating record(s)');
    }

  });


  this.on('MassuploadUpdate', async (req, next) => {
    let srv = cds.services['taqa.srv.TaqaDbService'];
    var data = req.data.parameter;
    console.log("empid:" + data[0].EmployeeID);

    const {
      TimeSheetDetails
    } = cds.entities('taqa.srv.TaqaDbService');

    try {

      const promises = [];

      console.log("emp length:" + data.length);
      for (const item of data) {

        // new code start
        // if(item.ItsAllowances.length > 0){
        //delete item.ItsAllowances.__metadata_type;
        //delete item.ItsAllowances.__metadata_uri
        // for (const itemAllowance of data) {

        // if(itemAllowance.createdAt){
        //   delete itemAllowance.createdAt;
        // }
        // if(itemAllowance.createdBy){
        //   delete itemAllowance.createdBy;
        // }
        // if(itemAllowance.modifiedBy){
        //   delete itemAllowance.modifiedBy;
        // }
        // if(itemAllowance.modifiedAt){
        //   delete itemAllowance.modifiedAt;
        // }



        // itemAllowance.parent_ID = item.ID;
        // itemAllowance.parent_AppID = item.AppID;
        // itemAllowance.parent_Date = item.Date;
        // itemAllowance.parent_EmployeeID = item.EmployeeID;
        // itemAllowance.parent_CostCenter = item.CostCenter;
        // itemAllowance.parent_InternalOrder = item.InternalOrder;
        // itemAllowance.parent_WbsCode = item.WbsCode;
        //}

        // }
        // new code start
        // if(item.ItsAllowances.length > 0){

        console.log("emp mass update:" + JSON.stringify(item));

        const updateCall = await UPDATE(TimeSheetDetails).set(
          item
        ).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });

        promises.push(updateCall);
        // }
      }
      const results = await Promise.all(promises);
      console.log("10k items update over");
      return { message: 'Update Successful' };

      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while updating record(s)');
    }

  });

  this.on('MassuploadCreate', async (req, next) => {
    let srv = cds.services['taqa.srv.TaqaDbService'];
    var data = req.data.parameter;
    console.log("empid:" + data[0].EmployeeID);

    const {
      TimeSheetDetails
    } = cds.entities('taqa.srv.TaqaDbService');

    try {

      const promises = [];

      console.log("emp length:" + data.length);

      const results = await srv.create(TimeSheetDetails).entries(data);
      //  results = await Promise.all(promises);
      return req.reply({ message: 'Create Successful' });

      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while creating record(s)');
    }

  });



  function extractStatusCode(response) {
    // Split the response by the boundary
    const boundary = response.split('\r\n')[0];
    const parts = response.split(boundary);

    // Iterate over the parts and find the HTTP response section
    for (const part of parts) {
      if (part.includes('HTTP/1.1')) {
        // Extract the status code using a regular expression
        const match = part.match(/HTTP\/1\.1 (\d{3})/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    }
    // Return null if no status code is found
    return null;
  }

  this.on('PostAllowance', async (req, next) => {

    const findMatchingAssignments = (ECData, timeSheetData) => {
      const allMatches = ECData.flatMap(obj => {
        const projectCode = `${obj.InternalOrder ?? ""}${obj.CostCenter ?? ""}${obj.WBS ?? ""}`;

        /*
            Employeenumber
            Validitydate
            WageType
            CostCenter
            WBS
            InternalOrder
             */
        return timeSheetData.filter(assignment =>
          assignment.EmployeeID === obj.Employeenumber &&
          assignment.InternalOrder === obj.InternalOrder &&
          assignment.CostCenter === obj.CostCenter &&
          assignment.WbsCode === obj.WBS &&
          assignment.Date === obj.Validitydate
        );
      });

      const uniqueMatches = Array.from(new Set(allMatches.map(a => JSON.stringify(a))))
        .map(a => JSON.parse(a));

      return uniqueMatches;
    };

    // ------------------------------------------ utility end -----------------------
    let srv = cds.services['taqa.srv.TaqaDbService'];
    const {
      Allowance
    } = cds.entities('taqa.srv.TaqaDbService');
    var data = req.data.parameter;
    var PostWagedata = req.data.wageInputs;
    var lockTableData = req.data.lockData;


    let replicatedRecords = [];
    let notyetReplicated = [];
    // push post wage data to ECP start 
    if (PostWagedata.length > 0) {


      const sapAxios = require('sap-cf-axios').default;
      console.log("Post data to ECP - In Progress");
      // new code start 05.08
      try {
        const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');
        const boundary = 'batch';
        const changesetBoundary = 'changeset_1';
        const maxBatchSize = 300; // Define the maximum number of items in a single batch request

        // Function to split array into chunks
        function chunkArray(array, chunkSize) {
          const result = [];
          for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
          }
          return result;
        }

        function ChunkArrayEmployeeWise(array) {
          const result = {};
          array.forEach(element => {
            if (result[element.Employeenumber]) {
              result[element.Employeenumber].push(element)
            } else {
              result[element.Employeenumber] = [element];
            }
          });
          return result;
        }

        // Split PostWagedata into smaller chunks
        // const chunks = chunkArray(PostWagedata, maxBatchSize);
        const chunks = ChunkArrayEmployeeWise(PostWagedata);

        async function sendBatchRequest(chunk) {
          let batchData = `--${boundary}\r\nContent-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;

          chunk.forEach((item, index) => {
            batchData += `--${changesetBoundary}\r\n`;
            batchData += `Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
            batchData += `POST OtabSet HTTP/1.1\r\n`;
            batchData += `Content-Type: application/json\r\n\r\n`;
            batchData += `${JSON.stringify(item)}\r\n\r\n`;
          });

          batchData += `--${changesetBoundary}--\r\n`;
          batchData += `--${boundary}--`;

          try {
            const response = await bupa.transaction(req).send({
              method: 'POST',
              path: '$batch',
              headers: {
                'Content-Type': 'multipart/mixed; boundary=batch'
              },
              data: batchData
            });
            console.log(`Batch processed successfully:`, response);
            return response;
          } catch (error) {
            console.error('Error processing batch:', error);
            throw error; // Rethrow error if needed or handle it
          }
        }

        // Process all chunks

        let allowances = []
        // function getRandomInteger(n) {
        //   return Math.floor(Math.random() * n) + 1;
        // }
        // const randomInteger = getRandomInteger(Object.keys(chunks).length) - 1;
        // const empid = Object.keys(chunks)[randomInteger];
        for (const key of Object.keys(chunks)) {
          try {
            // if (key === empid) throw new Error("error occured" + key);
            await sendBatchRequest(chunks[key]);

            console.log("Processing Batches");
            replicatedRecords = [...replicatedRecords, ...chunks[key]]
          } catch (error) {
            // Handle errors from specific batches here if necessary

            notyetReplicated = [...notyetReplicated, ...chunks[key]]
            console.error('Error sending batch request:', error);
          }
        }

        // new code end 05.08


      } catch (err) {
        console.error(err.message);
        req.error(500, 'Error while updating record(s):' + err.message);
      }

      // const statusCode = await extractStatusCode(response);
      //console.log(`HTTP Status Code: ${statusCode}`); // Output: HTTP Status Code: 201

      // if (statusCode === 200 || statusCode === 201) {

      console.log("Post data to ECP - Completed");
    }
    // push post wage data to ECP end 
    console.log("Post data to HANADB - In Progress");
    console.table(notyetReplicated);
    console.table(replicatedRecords);
    // -------------------------
    // getting records that are posted
    const PostedRecords = PostWagedata.filter(obj => replicatedRecords.find(rec => JSON.stringify(rec) === JSON.stringify(obj)))
    // error indicator insertion 
    const PostedDates = findMatchingAssignments(PostedRecords, data);
    console.table(PostedRecords);
    //------------------
    const {
      TimeSheetDetails
    } = cds.entities('taqa.srv.TaqaDbService');

    try {
      // const 
      const promises = [];

      console.log("emp length:" + PostedDates.length);
      // ------ logic to handle jobbonus -------
      let postingtoHANA = PostWagedata.length > 0 ? PostedDates : data;
      //----------------------------------------
      for (const item of postingtoHANA) {

        console.log("emp status:" + JSON.stringify(item));

        if (item.ItsAllowances?.length > 0) {
          console.log("In the update and allowance call")
          await UPDATE(TimeSheetDetails).set({
            ItsAllowances: item.ItsAllowances
          }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
        }



        if (item.ItsApprover?.length > 0) {
          await UPDATE(TimeSheetDetails).set({
            ItsApprover: item.ItsApprover,
          }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
        }

      }

      // ------------------- Fetching unposted dates ---------
      const unPostedRecords = PostWagedata.filter(obj => !replicatedRecords.find(rec => JSON.stringify(rec) === JSON.stringify(obj)))

      const unPostedDates = findMatchingAssignments(unPostedRecords, data);
      console.log("---------------Unposted Record--------");
      console.table(unPostedRecords);

      // ----------------------- Utitilites ----------------------
      const getTimesheetData = async (TimeSheetDetails, whereClause) => {
        // 
        var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
        return empData;
      }

      const formatDate = (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      };
      // ----------------------------------------------
      if (PostWagedata.length > 0 && unPostedDates.length > 0) {
        console.log("Inside IF");
        // ------- preparing the where clause to reduce load ----------------
        let uniqueEmployeeIDs = [...new Set(unPostedDates.map(obj => obj.EmployeeID))];
        let employeesString = uniqueEmployeeIDs.join(", ");

        const dates = unPostedDates.map(item => new Date(item.Date));
        const minDate = formatDate(new Date(Math.min(...dates)));
        const maxDate = formatDate(new Date(Math.max(...dates)));
        let whereClause = uniqueEmployeeIDs.map(id => `EmployeeID = '${id}'`).join(' OR ');
        whereClause = `(${whereClause}) AND Date >= '${minDate}' AND Date <= '${maxDate}'`// 
        // -----------------------------------------


        const AllowanceData = await getTimesheetData(Allowance, whereClause);
        const promises = [];
        for (const item of unPostedDates) {
          let ItsAllowances = AllowanceData.filter(obj => obj.Date === item.Date && obj.EmployeeID === item.EmployeeID);
          ItsAllowances.forEach(Allowance => {
            Allowance.ErrorIndicator = "X";
          });

          // ------- update error indicator ---------------
          if (ItsAllowances.length) {
            console.log("Inside Update");
            await UPDATE(TimeSheetDetails).set({
              ItsAllowances: ItsAllowances
            }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });

          }


        };

        // await Promise.all(promises);

        try {
          const workflow = await cds.connect.to('TAQA_BPA');
          let email = {
            "definitionId": "taqaerrornotification.ecperrornotification",//"eu10.taqa-dev-fiori.errorlog.errorLogListofEmployees",
            "context": {
              "employeeid": employeesString,
              "emailid": "pantothomasraja@kaartech.com",
            }
          }
          var results = await workflow.tx(req).post('/workflow-instances', email);


        } catch (error) {
          console.log("WorkFlow not triggered")
        }

      }
      console.log("Post data to HANADB - Completed");

      console.log("Release record - In Progress");
      let { LockTable } = cds.entities('taqa.srv.TaqaDbService');

      for (const item of lockTableData) {
        await DELETE(LockTable).where({ AppID: item.AppID, ProjectCode: item.ProjectCode, Department: item.Department });
      }


      console.log("Release record - Completed");
      try {
        return { message: 'Update Successful' };
      } catch (error) {
        req.error(500, 'Internal Server Error');
      }



      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while updating record(s)');
    }
    //}

  });

  this.on('PostAllowance1', async (req, next) => {
    let srv = cds.services['taqa.srv.TaqaDbService'];
    var data = req.data.parameter;
    var PostWagedata = req.data.wageInputs;
    var lockTableData = req.data.lockData;



    // push post wage data to ECP start 
    if (PostWagedata.length > 0) {


      const sapAxios = require('sap-cf-axios').default;
      console.log("Post data to ECP - In Progress");
      // new code start 05.08
      try {
        const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');
        const boundary = 'batch';
        const changesetBoundary = 'changeset_1';
        const maxBatchSize = 300; // Define the maximum number of items in a single batch request

        // Function to split array into chunks
        function chunkArray(array, chunkSize) {
          const result = [];
          for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
          }
          return result;
        }

        // Split PostWagedata into smaller chunks
        const chunks = chunkArray(PostWagedata, maxBatchSize);

        async function sendBatchRequest(chunk) {
          let batchData = `--${boundary}\r\nContent-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;

          chunk.forEach((item, index) => {
            batchData += `--${changesetBoundary}\r\n`;
            batchData += `Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
            batchData += `POST OtabSet HTTP/1.1\r\n`;
            batchData += `Content-Type: application/json\r\n\r\n`;
            batchData += `${JSON.stringify(item)}\r\n\r\n`;
          });

          batchData += `--${changesetBoundary}--\r\n`;
          batchData += `--${boundary}--`;

          try {
            const response = await bupa.transaction(req).send({
              method: 'POST',
              path: '$batch',
              headers: {
                'Content-Type': 'multipart/mixed; boundary=batch'
              },
              data: batchData
            });
            console.log(`Batch processed successfully:`, response);
            return response;
          } catch (error) {
            console.error('Error processing batch:', error);
            throw error; // Rethrow error if needed or handle it
          }
        }

        // Process all chunks
        for (const chunk of chunks) {
          try {
            await sendBatchRequest(chunk);

            console.log("Processing Batches");
          } catch (error) {
            // Handle errors from specific batches here if necessary


            console.error('Error sending batch request:', error);
          }
        }

        // new code end 05.08


      } catch (err) {
        console.error(err.message);
        req.error(500, 'Error while updating record(s):' + err.message);
      }

      // const statusCode = await extractStatusCode(response);
      //console.log(`HTTP Status Code: ${statusCode}`); // Output: HTTP Status Code: 201

      // if (statusCode === 200 || statusCode === 201) {

      console.log("Post data to ECP - Completed");
    }
    // push post wage data to ECP end 
    console.log("Post data to HANADB - In Progress");
    const {
      TimeSheetDetails
    } = cds.entities('taqa.srv.TaqaDbService');

    try {
      // const 
      const promises = [];

      console.log("emp length:" + data.length);
      for (const item of data) {

        console.log("emp status:" + JSON.stringify(item));

        if (item.ItsAllowances?.length > 0) {
          console.log("In the update and allowance call")
          await UPDATE(TimeSheetDetails).set({
            ItsAllowances: item.ItsAllowances
          }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
        }



        if (item.ItsApprover?.length > 0) {
          await UPDATE(TimeSheetDetails).set({
            ItsApprover: item.ItsApprover,
          }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
        }

      }
      console.log("Post data to HANADB - Completed");

      console.log("Release record - In Progress");
      let { LockTable } = cds.entities('taqa.srv.TaqaDbService');

      for (const item of lockTableData) {
        await DELETE(LockTable).where({ AppID: item.AppID, ProjectCode: item.ProjectCode, Department: item.Department });
      }


      console.log("Release record - Completed");
      try {
        return { message: 'Update Successful' };
      } catch (error) {
        req.error(500, 'Internal Server Error');
      }



      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while updating record(s)');
    }
    //}

  });

  this.on('PostApprovalData', async (req, next) => {
    let srv = cds.services['taqa.srv.TaqaDbService'];
    var data = req.data.parameter;

    console.log("empid:" + data[0].EmployeeID);

    const {
      ApproverTable
    } = cds.entities('taqa.srv.TaqaDbService');

    try {
      // const 
      const promises = [];

      console.log("emp length:" + data.length);
      // for (const item of data) {
      //   console.log("emp status:" + JSON.stringify(item));
      //   if (item.ItsApprover?.length > 0) {
      //     console.log("In the update and allowance call")
      //     await UPDATE(ApproverTable).set(items).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
      //   } 
      // }

      const results = await srv.create(ApproverTable).entries(data);

      try {
        return { message: 'Approval Update Successful' };
      } catch (error) {
        req.error(500, 'Internal Server Error');
      }

      //   console.log(results);
    } catch (err) {
      console.error(err);
      req.error(500, 'Error while updating record(s)');
    }

  });

  this.on("DELETE", "*", async (req, next) => {
    let id = req.data.ID;
    let cdsEntity = req.target.projection.from.ref[0];
    await UPDATE(cdsEntity).set({
      DELETED: true
    }).where({
      ID: id
    });
  });


  this.on("READ", "OtabSet", async (req, next) => {

    const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');
    return await bupa.transaction(req).send({
      query: req.query
    })

  });

  this.on("POST", "OtabSet", async (req, next) => {

    const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');


    try {
      //   const response = await bupa.transaction(req).send({
      //     method: 'POST',
      //     path: '/OtabSet', // Replace with the actual path to your endpoint
      //     data: req.data
      //   });
      //   return response;

      //////////

      const batchRequests = [
        {
          method: 'POST',
          url: '/OtabSet', // Adjust the path for each request
          headers: {
            'Content-Type': 'application/json'
          },
          body: req.data
        },
        // Add more requests if needed
      ];

      // let data = '--batch\r\nContent-Type: multipart/mixed; boundary=changeset_1\r\n\r\n--changeset_1\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST OtabSet HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{\r\n"LogicalSystem" : "BTP",\r\n"ReferenceTransaction" : "EXT",\r\n"Reversed" : "",\r\n"Employeenumber" : "00010004",\r\n"Validitydate" : "16.05.2024",\r\n"WageType" : "",\r\n"Number" : "",\r\n"Time" : "10:44:38",\r\n"Amount" : "",\r\n"ReferenceKey" : "1000424051692612TEST1",\r\n"CostCenter" : "",\r\n"WBS" : "SA400000004 WLS04",\r\n"InternalOrder" : "",\r\n"NetworkNumber" : "",\r\n"ActivityNumber" : ""\r\n}\r\n\r\n\r\n--changeset_1\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST OtabSet HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{\r\n"LogicalSystem" : "BTP",\r\n"ReferenceTransaction" : "EXT",\r\n"Reversed" : "",\r\n"Employeenumber" : "00010004",\r\n"Validitydate" : "16.05.2024",\r\n"WageType" : "",\r\n"Number" : "",\r\n"Time" : "10:44:38",\r\n"Amount" : "",\r\n"ReferenceKey" : "1000424051692612TEST2",\r\n"CostCenter" : "",\r\n"WBS" : "SA400000004 WLS04",\r\n"InternalOrder" : "",\r\n"NetworkNumber" : "",\r\n"ActivityNumber" : ""\r\n}\r\n--changeset_1--\r\n\r\n--batch--';

      const data = [
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST3",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST4",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST5",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST6",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST7",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST8",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TEST9",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        },
        {
          "Reversed": "",
          "Employeenumber": "10004",
          "Validitydate": "2024-05-16",
          "WageType": "9265",
          "Number": "1",
          "Time": "",
          "Amount": "",
          "ReferenceKey": "10004240516926TES10",
          "CostCenter": "",
          "WBS": "SA400000004 WLS04",
          "InternalOrder": "",
          "NetworkNumber": "",
          "ActivityNumber": "",
          "LogicalSystem": "BTP",
          "ReferenceTransaction": "EXT"
        }
      ];

      // Create the batch payload
      const boundary = 'batch';
      const changesetBoundary = 'changeset_1';
      let batchData = `--${boundary}\r\nContent-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
      const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');
      data.forEach((item, index) => {
        batchData += `--${changesetBoundary}\r\n`;
        batchData += `Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
        batchData += `POST OtabSet HTTP/1.1\r\n`;
        batchData += `Content-Type: application/json\r\n\r\n`;
        batchData += `${JSON.stringify(item)}\r\n\r\n`;
      });

      batchData += `--${changesetBoundary}--\r\n`;
      batchData += `--${boundary}--`;

      const response = await bupa.transaction(req).send({
        method: 'POST',
        path: '$batch',
        headers: {
          'Content-Type': 'multipart/mixed; boundary=batch'
        },
        data: batchData
      });
      //    var resp = JSON.parse(response);
      return response;
    } catch (error) {
      req.error(500, 'Failed to post data to external service', error);
    }




  });

  this.after("UPDATE", "TimeSheetDetails", async (req, next) => {

    try {
      return { message: 'Update Successful' };
    } catch (error) {

      req.error(500, 'Internal Server Error');
    }

  });




  this.on('PostWageFunc', async (req) => {

    try {
      const sapAxios = require('sap-cf-axios').default;
      const cpi = sapAxios("CPI_ECP_CLONING");
      var objWage = {
        "PTEX2010": req.data.wageInputs
      }

      const response = cpi({
        method: 'POST',
        //url: '/http/PTEX2010',
        url: '/http/PTEX2010_QA',
        headers: {
          "content-type": "application/json"
        },
        data: JSON.stringify(objWage),
        xsrfHeaderName: "x-csrf-token"
      });

      return objWage;
    } catch (error) {
      console.log(error)
    }
  });



  this.on("GET", "EmployeeEmailAlerts", async (req, next) => {



    let srv = cds.services['taqa.srv.TaqaDbService'];

    try {
      const {
        TimeSheetDetails, RowInfo
      } = cds.entities('taqa.srv.TaqaDbService');

      let cdsEntity = 'taqa.db.TimeSheetDetails';

      const sapAxios = require('sap-cf-axios').default;


      const getWhereClause = (appid, d1, d2) => {
        return `
        (AppID = '${appid}' OR AppID = 'PROALONOR') AND
        (
          (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
          (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
          (StartDate <= '${d1}' AND EndDate >= '${d2}')
        )
      `;

      };

      const getTimesheetData = async (TimeSheetDetails, whereClause) => {
        // 
        var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
        return empData;
      };

      const formatDate = (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      };
      function isGreaterOrEqual(inputString, referenceString = "PG13") {
        // Normalize the input and reference strings
        const normalizedInput = inputString.toUpperCase();
        const normalizedReference = referenceString.toUpperCase();

        // Check if the input is "NA" or "N/A"
        if (normalizedInput === "NA") {
          return true; // Ignore NA; consider it greater or do whatever logic you want
        }

        // Extract the alphabetical and numeric parts
        const [inputPrefix, inputNumber] = extractParts(normalizedInput);
        const [referencePrefix, referenceNumber] = extractParts(normalizedReference);

        // Compare the prefixes
        if (inputPrefix > referencePrefix) {
          return true; // input is greater
        } else if (inputPrefix < referencePrefix) {
          return false; // input is lesser
        } else {
          // If prefixes are equal, compare numeric parts
          return parseInt(inputNumber, 10) >= parseInt(referenceNumber, 10);
        }
      }

      // Helper function to extract the prefix and numeric part
      function extractParts(str) {
        const match = str.match(/^([A-Za-z]+)(\d+)$/);
        return match ? [match[1], match[2]] : [str, "0"]; // Return the parts or default if not matched
      }

      let today = new Date();
      const pastDate = new Date();
      pastDate.setMonth(today.getMonth() - 1);
      var sDate = formatDate(pastDate);
      var eDate = formatDate(today);


      let whereClause = getWhereClause("PROALO", sDate, eDate);
      const Assignments = await getTimesheetData(TimeSheetDetails, whereClause);
      let emailpayload = [];
      if (Assignments.length > 0) {

        let uniqueEmployeeIDs = [...new Set(Assignments.map(employee => employee.EmployeeID))];
        whereClause = `Date >= '${sDate}' AND Date <= '${eDate}'`;
        const TimeSheetData = await getTimesheetData(TimeSheetDetails, whereClause);

        const ampscodes = (await SELECT.from('taqa.srv.TaqaDbService.RowInfo').where({TableName: 'AMPS'})).map(oItem => oItem.Column1 ?? "");

        for (let ID of uniqueEmployeeIDs) {
          let currentDate = new Date(sDate);
          const Assignment = Assignments.filter(obj => obj.EmployeeID === ID);
          let startDate = null, endDate = null;
          if (Assignment.find(obj => obj.CompanyCode === "1000" || obj.Workschedule === "5D8HSUNTHU" || isGreaterOrEqual(obj.PayGrade))) {
            continue;
          }
          if(Assignment.find(obj => ampscodes.includes(obj.CompanyCode))){
            continue;
          }
          while (currentDate <= today) {
            const isValidDate = Assignment.filter(obj => obj.StartDate <= formatDate(currentDate) && obj.EndDate >= formatDate(currentDate))
            if (isValidDate.length !== 0 && TimeSheetData.find(obj => obj.EmployeeID === ID && obj.Date === formatDate(currentDate) && obj.Status !== "Open" && obj.Status !== "Draft") === undefined) {
              // push mail payload
              if (startDate === null) {
                startDate = formatDate(currentDate, 2);
              }
              endDate = formatDate(currentDate, 2);

              // break;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (startDate !== null && endDate !== null) {
            emailpayload.push(
              {
                "definitionId": "taqaemployeereminder.employeeremindernotification", //"eu10.taqa-dev-fiori.employeeemail.employeeEmailNotiication",
                "context": {
                  "employeeid": ID,
                  "employeeemail": Assignment[0]?.EmpEmailID ?? "",
                  "employeename": Assignment[0]?.EmployeeName ?? "",
                  "startdate": startDate,
                  "enddate": endDate,
                }
              }
            )
          }
        }


        console.table(emailpayload);
      }


      try {
        const workflow = await cds.connect.to('TAQA_BPA_CPI');
        console.log("connected to workflow");
        for (email of emailpayload) {
          console.table(email.context);
          var results = await workflow.tx(req).post('/workflow-instances', email);
        }
      } catch (error) {
        console.log("Error" + JSON.stringify(error));
        return error;
        // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
      }


      console.log(results)
      // const response = emailDestination({
      //   method: 'POST',
      //   url: '/http/workflow-instances',
      //   headers: {
      //     "content-type": "application/json"
      //   },
      //   data: JSON.stringify({
      //     "definitionId": "eu10.taqa-dev-fiori.mailtrigger.aPITRIGGER",
      //     "context": {
      //       "empid": "EmployeeID",
      //       "employeename": "EmployeeName",
      //       "firstdate": "firstDate",
      //       "lastdate": "lastDate",
      //       "status": "status",
      //       "statusflag": true,
      //       "emailid": "data[0].Column4",
      //       "approverName": " data[0].Column5",
      //       "approveremailid": " data[0].Column5",
      //       "costobject": "ProjectDesc"
      //     }
      //   }),
      //   xsrfHeaderName: "x-csrf-token"
      // });

      return results
    } catch (error) {
      console.log(error)
    }

  });

  this.on("GET", "ProcessRecords", async (req, next) => {
    const {
      TimeSheetDetails, Allowance
    } = cds.entities('taqa.srv.TaqaDbService');

    const getWhereClause = (appid, d1, d2) => {
      return `
      (AppID = '${appid}' OR AppID = 'PROALONOR') AND
      (
        (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
        (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
        (StartDate <= '${d1}' AND EndDate >= '${d2}')
      )
    `;

    };

    const formatDate = (date, format = 1) => {

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      if (format === 1) return `${year}-${month}-${day}`;
      else if (format === 2) return `${day}-${month}-${year}`;
      else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
      else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
    };

    const getTimesheetData = async (TimeSheetDetails, whereClause) => {
      // 
      var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
      return empData;
    };

    const getUniqueCombinations = (arr) => {
      const uniqueCombinations = new Set();

      arr.forEach(item => {
        // Create a unique identifier by combining the keys
        const combinationKey = `${item.Department}-${item.ProjectCode}-${item.AppID}`;
        uniqueCombinations.add(combinationKey);
      });

      // Convert the Set back to an array of objects
      return Array.from(uniqueCombinations).map(key => {
        const [Department, ProjectCode, AppID] = key.split('-');
        return { Department, ProjectCode, AppID };
      });
    };

    const findMatchingAssignments = (employeeData, projectAssignments) => {
      const allMatches = employeeData.flatMap(obj => {
        const projectCode = `${obj.InternalOrder ?? ""}${obj.CostCenter ?? ""}${obj.WbsCode ?? ""}`;

        return projectAssignments.filter(assignment =>
          assignment.EmployeeID === obj.EmployeeID &&
          assignment.InternalOrder === obj.InternalOrder &&
          assignment.CostCenter === obj.CostCenter &&
          assignment.WbsCode === obj.WbsCode &&
          assignment.StartDate <= obj.Date &&
          assignment.EndDate >= obj.Date
          && obj.ErrorIndicator === "X"
        );
      });

      const uniqueMatches = Array.from(new Set(allMatches.map(a => JSON.stringify(a))))
        .map(a => JSON.parse(a));

      return uniqueMatches;
    };


    let today = new Date();
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 3);
    var sDate = formatDate(pastDate);
    var eDate = formatDate(today);

    let whereClause = getWhereClause("PROALO", sDate, eDate);
    let Assignments = await getTimesheetData(TimeSheetDetails, whereClause);

    whereClause = `Date >= '${sDate}' AND Date <= '${eDate}'`;
    const TimeSheetData = await getTimesheetData(TimeSheetDetails, whereClause);

    const AllowanceData = await getTimesheetData(Allowance, whereClause);
    Assignments = findMatchingAssignments(AllowanceData, Assignments);

    if (Assignments.length === 0) return;

    let ECpayload = [];
    let AllowancePayload = [];

    Assignments.forEach(Assignment => {
      const TimesheetBooking = TimeSheetData.filter(({ EmployeeID, ProjectCode, StartDate, EndDate }) =>
        Assignment.EmployeeID === EmployeeID &&
        Assignment.ProjectCode === ProjectCode &&
        Assignment.StartDate === StartDate &&
        Assignment.EndDate === EndDate);

      const AllowanceBooking = AllowanceData.filter(({ EmployeeID }) => Assignment.EmployeeID === EmployeeID)

      TimesheetBooking.forEach(timeEntry => {
        if (timeEntry.Status !== "Approved") return;

        let ItsAllowances = AllowanceBooking.filter(({ parent_ID }) => timeEntry.ID === parent_ID);

        if (!ItsAllowances.find(obj => obj.ErrorIndicator === "X")) return;

        ItsAllowances.forEach(Allowance => {
          if (Allowance.ErrorIndicator !== "X") return;
          Allowance.ErrorIndicator = "";
          if (Allowance.HistoryRecord === 'X') return;
          if (timeEntry.QhseStatus === "Submitted" && Allowance.AllowanceID === "9000") return;

          if (Allowance.Status === "Not yet Replicated") {
            Allowance.Status = "Replicated";
            if (Allowance.Reversed === "X") {
              Allowance.HistoryRecord = "X";
              var Allowance1 = ItsAllowances.find(obj => obj.AllowanceID === Allowance.AllowanceID && obj.Reversed !== "X" && obj.HistoryRecord === "");
              if (Allowance1) {
                Allowance1.HistoryRecord = "X";
              }
            }
            // generate ECP payload
            ECpayload.push({
              Reversed: Allowance.Reversed,
              Employeenumber: Allowance.EmployeeID ?? "",
              Validitydate: Allowance.Date ?? "",
              WageType: Allowance.AllowanceID,
              Number: Allowance.Number,
              Time: "",
              Amount: "",
              ReferenceKey: Allowance.ReferenceKey,
              CostCenter: Allowance.CostCenter ?? "",
              WBS: Allowance.WbsCode ?? "",
              InternalOrder: Allowance.InternalOrder ?? "",
              NetworkNumber: "",
              ActivityNumber: "",
              LogicalSystem: "BTP",
              ReferenceTransaction: "EXT"
            });
          }


        });

        let entryPayload = { ...timeEntry, ItsAllowances }
        if (ItsAllowances.length) {
          AllowancePayload.push(entryPayload)
        }
        // ItsAllowances.length ? AllowancePayload.push(entryPayload): null;

      });
    });

    console.log({ ECpayload, AllowancePayload });
    let done = true;
    if (ECpayload.length > 0) {
      const sapAxios = require('sap-cf-axios').default;
      console.log("Post data to ECP - In Progress");

      try {
        const bupa = await cds.connect.to('ZHCM_PRJ_TS_POST_OTAB_SRV');
        const boundary = 'batch';
        const changesetBoundary = 'changeset_1';
        const maxBatchSize = 300; // Define the maximum number of items in a single batch request

        // Function to split array into chunks
        function chunkArray(array, chunkSize) {
          const result = [];
          for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
          }
          return result;
        }

        function ChunkArrayEmployeeWise(array) {
          const result = {};
          array.forEach(element => {
            if (result[element.Employeenumber]) {
              result[element.Employeenumber].push(element)
            } else {
              result[element.Employeenumber] = [element];
            }
          });
          return result;
        }
        // Split PostWagedata into smaller chunks
        const chunks = ChunkArrayEmployeeWise(ECpayload, maxBatchSize);



        async function sendBatchRequest(chunk) {

          const handleErrorResponse = (responseString) => {
            let responseObject;

            // Step 1: Parse the stringified JSON response
            try {
              responseObject = JSON.parse(responseString);
            } catch (error) {
              console.error("Failed to parse response:", error);
              return;
            }

            // Step 2: Handle potential errors based on the parsed object
            if (responseObject.error) {
              throw new Error(responseObject.error.message)
              // // Handling a common error structure
              // console.error("Error Code:", responseObject.error.code);
              // console.error("Error Message:", responseObject.error.message);
              // Optionally, you can alert the user or handle it as needed
            } else if (responseObject.hasOwnProperty('code') && responseObject.hasOwnProperty('message')) {
              // Handling another possible error structure
              console.error("Error Code:", responseObject.code);
              console.error("Error Message:", responseObject.message);
              throw new Error(responseObject.error.message);
            } else {
              // Handle cases where no explicit error is found
              console.log("Response does not indicate an error:", responseObject);
            }
          };
          let batchData = `--${boundary}\r\nContent-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;

          chunk.forEach((item, index) => {
            batchData += `--${changesetBoundary}\r\n`;
            batchData += `Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
            batchData += `POST OtabSet HTTP/1.1\r\n`;
            batchData += `Content-Type: application/json\r\n\r\n`;
            batchData += `${JSON.stringify(item)}\r\n\r\n`;
          });

          batchData += `--${changesetBoundary}--\r\n`;
          batchData += `--${boundary}--`;

          try {
            const response = await bupa.transaction(req).send({
              method: 'POST',
              path: '$batch',
              headers: {
                'Content-Type': 'multipart/mixed; boundary=batch'
              },
              data: batchData
            });
            // handleErrorResponse(response);
            console.log(`Batch processed successfully:`, JSON.stringify(response));
            return response;
          } catch (error) {
            console.error('Error processing batch:', error);

            throw error; // Rethrow error if needed or handle it
          }
        }

        // Process all chunks
        for (const key of Object.keys(chunks)) {
          try {
            const response = await sendBatchRequest(chunks[key]);
            console.table(response);
            console.log(JSON.stringify(response));
            let pd = AllowancePayload.filter(obj => obj.EmployeeID === chunks[key][0]?.Employeenumber);
            for (const item of pd) {
              if (item?.ItsAllowances?.length > 0) {
                console.log("In the update and allowance call");
                await UPDATE(TimeSheetDetails).set({
                  ItsAllowances: item.ItsAllowances
                }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
              }
            }

            console.log("Processing Batches");
          } catch (error) {
            done = false;
            // Handle errors from specific batches here if necessary
            console.error('Error sending batch request:', error);
          }
        }

        // new code end 05.08




      } catch (err) {
        console.error(err.message);
        req.error(500, 'Error while updating record(s):' + err.message);
      }

      // const statusCode = await extractStatusCode(response);
      //console.log(`HTTP Status Code: ${statusCode}`); // Output: HTTP Status Code: 201

      // if (statusCode === 200 || statusCode === 201) {

      console.log("Post data to ECP - Completed");
    }

    // if (AllowancePayload.length > 0 && done) {
    //   let data = AllowancePayload;
    //   try {
    //     // const 
    //     const promises = [];

    //     console.log("emp length:" + data.length);
    //     for (const item of data) {

    //       console.log("emp status:" + JSON.stringify(item));

    //       if (item.ItsAllowances?.length > 0) {
    //         console.log("In the update and allowance call")
    //         await UPDATE(TimeSheetDetails).set({
    //           ItsAllowances: item.ItsAllowances
    //         }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
    //       }



    //       if (item.ItsApprover?.length > 0) {
    //         await UPDATE(TimeSheetDetails).set({
    //           ItsApprover: item.ItsApprover,
    //         }).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
    //       }

    //     }
    //     console.log("Post data to HANADB - Completed");

    //     console.log("Release record - In Progress");
    //     let { LockTable } = cds.entities('taqa.srv.TaqaDbService');
    //     let lockTableData = getUniqueCombinations(Assignments);

    //     for (const item of lockTableData) {
    //       await DELETE(LockTable).where({ ProjectCode: item.ProjectCode, Department: item.Department });
    //     }


    //     console.log("Release record - Completed");
    //     try {
    //       return { message: 'Update Successful' };
    //     } catch (error) {
    //       req.error(500, 'Internal Server Error');
    //     }



    //     //   console.log(results);
    //   } catch (err) {
    //     console.error(err);
    //     req.error(500, 'Error while updating record(s)');
    //   }
    // }

    if (!done) {
      throw new Error("All Records did not get posted please check")
    }







  });

  this.on("GET", "MasterDataUpdate", async (req, next) => {

    const { TimeSheetDetails, RowInfo, LineManagerApproverTable, Allowance } = cds.entities('taqa.srv.TaqaDbService');

    let srv = cds.services['taqa.srv.TaqaDbService'];
    const Utilities = {

      convertToDateString: (dateString) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Check if the Date object is valid
          // if (isNaN(date)) {
          //   throw new Error("Invalid timestamp");
          // }

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      generateDates: function (startDate, endDate, format = 1) {

        let currentDate = new Date(startDate);
        let datesArray = [];

        while (currentDate <= new Date(endDate)) {
          datesArray.push(Utilities.formatDate(currentDate, format));
          // Incrementing currentDate
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return datesArray;
      },

      constructURL: (baseURL, filter, parameters, expand = '', select = '', orderby = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty or undefined
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided and not empty
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        if (select) {
          queryParts.push(`$select=${encodeURIComponent(select)}`);
        }

        if (orderby) {
          queryParts.push(`$orderby=${encodeURIComponent(orderby)}`);

        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            // Ensure both key and value are URL encoded
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}` : `${baseURL}?`;

        return fullURL;
      },


      getSFData: async (baseURL, filter, parameters, expand, select, orderby) => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand, select, orderby);
        const batchSize = 1000; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}&$top=${batchSize}&$skip=${skip}`;
          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            data = data.concat(SFdata);

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error WITH API: " + error);
            console.log("Error : " + error);
            break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
      generateHashMapArray: function (array, key) {
        const HashMap = new Map();
        array.forEach(item => {
          if (!HashMap.has(item[key])) {
            HashMap.set(item[key], []);
          }
          HashMap.get(item[key]).push(item);
        });
        return HashMap;
      },
      formatDate: (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else if (format === 4) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      },
      getAdjustedDates: (dates, startDate, endDate, cutoffStartDate, cutoffEndDate) => {
        let minStartDate = dates[0][startDate];
        let maxEndDate = dates[0][endDate];

        dates.forEach((obj) => {
          if (obj[startDate] < minStartDate) minStartDate = obj[startDate];
          if (obj[endDate] > maxEndDate) maxEndDate = obj[endDate];
        });

        // Apply cutoff logic
        const adjustedStartDate = minStartDate < cutoffStartDate ? cutoffStartDate : minStartDate;
        const adjustedEndDate = maxEndDate > cutoffEndDate ? cutoffEndDate : maxEndDate;

        return { adjustedStartDate, adjustedEndDate };
      },
      updateArrayonPerPerson: function (array, key, perPersonData) {


        return array.map(element => {
          const employee = perPersonData.find(({ EmpUserEmail }) => EmpUserEmail === element[key]);
          return employee ? { ...element, EmployeeID: employee.EmployeeID, EmpUserEmail: employee.EmpUserEmail } : element;
        })
        // return perPersonData.map(element => {
        //     // Find the matching employee based on EmpUserEmail
        //     const employee = array.find(obj => obj[key] === element.EmpUserEmail);

        //     // If an employee is found, return a new object with updated properties
        //     return employee ? { ...employee, EmployeeID: element.EmployeeID, EmpUserEmail: element.EmpUserEmail} : employee;
        // });

      },
    };


    const processMaintenanceData = (maintenanceData) => {
      const TableMaintenanceHelper = {
        getOverTimeException: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Exception")
            .map(oItem => ({
              WorkTypeCode: oItem?.Column1 ?? "",
              Hours: oItem?.Column2 ?? ""
            }));
        },

        getOverTimeValidity: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Eligibility")
            .map(oItem => ({
              PayGrade: oItem?.Column2
            }));
        },
        getAMPSOvertimeDetails: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Location Formula")
            .map(oItem => ({
              Location: oItem?.Column2,
              Normal: oItem?.Column3,
              WeekOff: oItem?.Column4,
              Holiday: oItem?.Column5,
              Night: oItem?.Column6,
              NightHours: oItem?.Column7

            }));
        },
        getAllowancevalidity: tableData => {
          return tableData
            .filter(object => object?.TableName === "Allowances")
            .map(oItem => ({
              HanaID: oItem?.Column1 ?? "",
              AllowanceDesc: oItem?.Column2 ?? "",
              Amount: oItem?.Column3 ?? "",
              CompanyCode: oItem?.Column4 ?? "",
              Department: oItem?.Column6 ?? "",
              Location: oItem.Column10 ?? "",


              Import: oItem?.Column8 ?? "",
              AllowanceID: oItem.Column9 ?? "",
            }));


        },
        getAMPSCodes: tableData => {
          return tableData
            .filter(object => object?.TableName === "AMPS")
            .map(oItem => oItem?.Column1 ?? "");
        },

        getLastRunDate: tableData => {
          return tableData
            .filter(object => object?.TableName === "Master Update Settings")
            .map(oItem => ({
              Date: oItem?.Column1 ?? "",
              Time: oItem?.Column2 ?? "",
            }));
        },

        getEmployeeIDS: tableData => {
          return tableData
            .filter(object => object?.TableName === "Master Update Employees")
            .map(oItem => ({
              EmployeeID : oItem?.Column1 ?? "",
              CompanyCode : oItem?.Column2 ?? "",
            }));
        },

        getLastRunDateforUpdate: tableData => {
          return tableData
            .filter(object => object?.TableName === "Master Update Settings")
            .map(oItem => ({
              ID: oItem?.ID,
              Date: oItem?.Column1 ?? ""
            }))
        }

      };

      const OvertimeEligibility = TableMaintenanceHelper.getOverTimeValidity(maintenanceData);
      const AllowanceEligibility = TableMaintenanceHelper.getAllowancevalidity(maintenanceData);
      const AMPSCodes = TableMaintenanceHelper.getAMPSCodes(maintenanceData);
      const OvertimeException = TableMaintenanceHelper.getOverTimeException(maintenanceData);
      const AMPSOvertime = TableMaintenanceHelper.getAMPSOvertimeDetails(maintenanceData);
      const val = TableMaintenanceHelper.getLastRunDate(maintenanceData)[0]
      const lastupdatedDate = new Date(`${val?.Date}T${val?.Time}`);
      const arr = TableMaintenanceHelper.getEmployeeIDS(maintenanceData);
      const updateEmployees = [...new Set(arr.filter(obj => obj.EmployeeID != '').map(obj => obj.EmployeeID))];
      const CompanyCodes = [...new Set(arr.filter(obj => obj.CompanyCode != '').map(obj => obj.CompanyCode))];
      const lastRunDateUpdate = TableMaintenanceHelper.getLastRunDateforUpdate(maintenanceData)[0];


      return {
        OvertimeEligibility,
        AllowanceEligibility,
        AMPSCodes,
        OvertimeException,
        AMPSOvertime,
        lastupdatedDate,
        updateEmployees,
        CompanyCodes,
        lastRunDateUpdate

      }



    };



    //   let times =  await SELECT.from(TimeSheetDetails, ts => {
    //     ts('*'), // Select all fields from TimeSheetDetails
    //     ts.ItsAllowances(a => {
    //       a`.*` // Select the itsallowances field from the related Allowance entity
    //     })
    // })
    let today = Utilities.formatDate(new Date());

    let currentDateTime = Utilities.formatDate(new Date(), 4);

    let query = `SELECT DISTINCT EMPLOYEEID, EMPUSEREMAIL FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS" WHERE APPID = 'PROALO' AND STARTDATE <= '${today}'
     AND ENDDATE >= '${today}' AND DELETED = false`;
    let data = await db.run(query);
    let EmployeeIdData = data.map(oItem => ({
      EmployeeID: oItem.EMPLOYEEID,
      EmpUserEmail: oItem.EMPUSEREMAIL
    }));

    // let lastupdatedDate = new Date('2024-11-19T00:00:00');

    let AMPSCodesQuery = `SELECT COLUMN1 AS code FROM  "TAQA"."TAQA_DB_ROWINFO" WHERE TABLENAME = 'AMPS' AND DELETED = false`;
    let AMPSCodes = await db.run(AMPSCodesQuery);
    AMPSCodes = AMPSCodes.map(oItem => oItem.CODE);
    console.log(EmployeeIdData);


    const LineManagerTable = await SELECT.from(LineManagerApproverTable);

    const maintenanceRawData = await SELECT.from(RowInfo);

    const maintenanceData = processMaintenanceData(maintenanceRawData)

    const { lastupdatedDate, updateEmployees, CompanyCodes } = maintenanceData;

    let datesQuery = `SELECT COLUMN1, COLUMN2 FROM  "TAQA"."TAQA_DB_ROWINFO" WHERE TABLENAME = 'CutOffCycles' AND COLUMN1 <= '${today}' AND COLUMN2 >= '${today}' AND DELETED = false`;
    let dates = await db.run(datesQuery);

      // const today = new Date();

      // Calculate the date two months before today
      
    // const cutOffStartDate = dates[0].COLUMN1, cutOffEndDate = dates[0].COLUMN2;

    let tod = new Date();
    const pastDate = new Date();
    pastDate.setMonth(tod.getMonth() - 3);
    var sDate = Utilities.formatDate(pastDate);
    var eDate = Utilities.formatDate(tod);
    const cutOffStartDate = sDate, cutOffEndDate = eDate;




    const oURLSettings = {
      Empjob: {
        mapData: (data, ampscodes) => {
          const employeeTypeMap = {
            "627826": "Rotational",
            "627825": "Regular",
          };

          const extractWSNumbers = (input, isAmps) => {
            if (isAmps) {
              const [firstNumber, secondNumber] = input.split('/');
              return firstNumber && secondNumber ? (parseInt(secondNumber) / parseInt(firstNumber)).toFixed(2) : '';
            }

            const match = input.match(/(\d+)\s*x\s*(\d+)/i);
            return match ? (parseInt(match[2]) / parseInt(match[1])).toFixed(2) : '';
          };

          return (data || []).map(oItem => ({
            EmployeeID: oItem?.userId ?? "",
            EmpUserEmail: oItem?.userId ?? "",
            EffectiveStartDate: Utilities.convertToDateString(oItem?.startDate || ""),
            EffectiveEndDate: Utilities.convertToDateString(oItem?.endDate || ""),
            EmployeeName: oItem?.userNav?.defaultFullName ?? "",
            Division: oItem?.division ?? "",
            DivisionDesc: oItem?.divisionNav?.name ?? "",
            Department: oItem?.department ?? "",
            DepartmentDesc: oItem?.departmentNav?.name ?? "",
            Location: oItem?.location ?? "",
            Country: oItem?.countryOfCompany ?? "",
            OperationalIndicator: oItem?.timeRecordingProfileCode ?? "",
            LocationDesc: oItem?.locationNav?.name ?? "",
            JobTitle: oItem?.jobTitle ?? "",
            CompanyCode: oItem?.company ?? "",
            CompanyCodeDesc: oItem?.companyNav?.name_defaultValue ?? "",
            Workschedule: oItem?.workscheduleCode ?? "",
            Religion: oItem?.Religion ?? "",
            PayGrade: oItem?.payGrade ?? "",
            EmpEmailID: oItem?.userNav?.email ?? "",
            OvertimeEligibility: oItem?.customString12 === '627151' ? 'X' : "",
            EmployeeIs: employeeTypeMap[oItem?.customString6] ?? "",
            RawbalanceAMPS: ampscodes.includes(oItem?.company) ? (oItem?.customString13Nav?.localeLabel ?? "") : "",
            RotationalLeaveBalance: employeeTypeMap[oItem?.customString6] === "Rotational"
              ? extractWSNumbers(ampscodes.includes(oItem?.company) ? (oItem?.customString13Nav?.localeLabel ?? "") : (oItem?.workscheduleCode ?? ""), ampscodes.includes(oItem?.company))
              : ""
          }));
        },
        getBaseURL: () => "/EmpJob",
        getFilter: (companyCodes, key = 'company') => {
          const EmployeeFilter = `(${companyCodes.map(id => `${key} eq '${id}'`).join(' or ')})`;
          return EmployeeFilter;
        },
        getNewFilter: () => `lastModifiedOn ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}' and emplStatusNav/picklistLabels/label eq 'Active'`,
        // getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getParameter: () => {
          return { 'fromDate': '1' }
        },
        getSelect: () => "userId,startDate,endDate,department,division,payGrade,standardHours,jobTitle,userNav/defaultFullName,userNav/displayName,divisionNav/name,departmentNav/name,locationNav/name,workingDaysPerWeek,customString6,company,location,workscheduleCode,emplStatusNav/picklistLabels,userNav/email,timeRecordingProfileCode,countryOfCompany,companyNav/name_defaultValue,customString13Nav/localeLabel,customString12", // localeLabel
        getOrderBy: () => `userId asc,startDate asc,endDate asc`, // department asc, division asc, company asc, location asc, workscheduleCode asc, startDate asc, endDate asc, paygrade asc, standardHours asc, jobTitle asc
        getExpand: () => "userNav,companyNav,divisionNav,departmentNav,locationNav,emplStatusNav/picklistLabels,customString13Nav"
      },
      perperson: {
        mapData: (perpersonData) => (perpersonData || []).map(oItem => ({
          EmployeeID: oItem?.personIdExternal ?? "",
          EmpUserEmail: oItem?.userAccountNav?.user?.results[0]?.userId ?? ""
        })),
        getBaseURL: () => "/PerPerson",
        getFilter: (EmployeeIDList, key = "userAccountNav/user/userId") => {
          // const ids = EmployeeIDList.map(id => `'${id}'`).join(", ");
          // return `(${key} in (${ids}))`;
          const Filter = EmployeeIDList.map(id => `${key} eq '${id}'`).join(' or ');
          return "(" + Filter + ")";
        },
        getExpand: () => "userAccountNav,userAccountNav/user",


      },

      Absence: {
        mapData: (absenceDataArg) => {
          const absenceData = (absenceDataArg || []).filter(oItem => oItem.timeTypeNav.category === "ABSENCE");
          return absenceData.flatMap(oItem => {
            return Utilities.generateDates(Utilities.convertToDateString(oItem?.startDate), Utilities.convertToDateString(oItem?.endDate))
              .map(date => ({
                LeaveCode: oItem?.timeType ?? "",
                EmployeeID: oItem?.userId ?? "",
                Date: date ?? "",
                Reason: oItem?.timeTypeNav?.externalName_defaultValue ?? "",
                ApprovalStatus: oItem?.approvalStatus ?? ""
              }));
          });
        },
        getBaseURL: () => "/EmployeeTime",
        getFilter: (EmployeeIDList, key = "userId") => {
          // const ids = EmployeeIDList.map(id => `'${id}'`).join(", ");
          // return `(${key} in (${ids}))`;
          const EmployeeFilter = `(${EmployeeIDList.map(id => `${key} eq '${id}'`).join(' or ')})`;
          const lastmodifiedFilter = `lastModifiedDateTime ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}'`
          const timePeriodFilter = `(endDate ge datetime'${Utilities.formatDate(pastDate, 4)}' and startDate le datetime'${Utilities.formatDate(tod, 4)}')`;
          let finalFilter = `(${lastmodifiedFilter} or ${timePeriodFilter})`;
          if(EmployeeIDList.length > 0){
            finalFilter +=  ` and ${EmployeeFilter}`;
          }
          
          return finalFilter;
        },
        getNewFilter: () => `lastModifiedDateTime ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}' or endDate ge '${Utilities.formatDate(pastDate, 4)}'`,
        // getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "timeTypeNav"
      },

      Allowance: {
        mapData: (Allowances) => (Allowances || []).map(oItem => ({
          EmployeeID: oItem?.userId ?? "",
          // EmpUserEmail: oItem?.userId ?? "",
          AllowanceDesc: oItem?.payComponentNav?.name ?? "",
          AllowanceID: oItem?.payComponent ?? "",
          Amount: oItem?.paycompvalue ?? "",
          StartDate: Utilities.convertToDateString(oItem?.startDate || ""),
          EndDate: Utilities.convertToDateString(oItem?.endDate || "")
        })),
        getBaseURL: () => "/EmpPayCompRecurring",
        getNewFilter: () => `lastModifiedDateTime ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}'`,
        getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "payComponentNav"
      },

      Workschedule: {
        mapData: (workingHoursData) => (workingHoursData || []).map(oItem => ({
          Workschedule: oItem?.externalCode ?? "",
          WorkingHours: oItem?.workScheduleDays?.results?.map(oHours => oHours?.workingHours)
        })),

        getBaseURL: () => "/WorkSchedule",
        getFilter: (workSchedules, key) => workSchedules.map(id => `${key} eq '${id}'`).join(' or '),
        getExpand: () => "workScheduleDays"
      },

      Holiday: {
        mapData: (Holidays) => {
          return (Holidays || []).flatMap(oItem => {
            const Country = oItem?.country || "";
            return (oItem?.holidayAssignments?.results || []).map(Holiday => ({
              Country,
              Name: Holiday?.holidayNav?.name_defaultValue || "",
              Date: Utilities.convertToDateString(Holiday?.date)
            }));
          });
        },
        getBaseURL: () => "/HolidayCalendar",
        getFilter: () => "",
        // getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "countryNav,holidayAssignments,holidayAssignments/holidayNav"
      }
    };





    const UpdateLeaveRecords = async (AbsenceData, adjustedStartDate, adjustedEndDate, maintenanceData) => {
      const tx = cds.transaction(); // Start a new transaction

      const { updateEmployees } = maintenanceData;

      try {
        let EmployeeIDs = [...new Set(AbsenceData.map(employee => employee.EmployeeID))];

        if (updateEmployees.length > 0) {
          EmployeeIDs = EmployeeIDs.filter(obj => updateEmployees.includes(obj));
        }

        // Locking the records for update using forUpdate()
        const getWhereClause = (appid, d1, d2, updateEmployees, key = 'EmployeeID') => {
          const EmployeeFilter = `(${updateEmployees.map(id => `${key} = '${id}'`).join(' OR ')})`;

          return `
          (((AppID = '${appid}' OR AppID = 'PROALONOR') AND
          (
            (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
            (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
            (StartDate <= '${d1}' AND EndDate >= '${d2}')
          )) OR
         ((AppID = 'EMPTIM') AND (Date >= '${d1}' AND Date <= '${d2}'))) AND (${EmployeeFilter})
          `;

        }
        const BATCH_SIZE = 100;
        const results = [];

        // Split EmployeeIDs into chunks of 100
        

          const whereclause = getWhereClause("PROALO", adjustedStartDate, adjustedEndDate, EmployeeIDs);
          const TimeSheetQuery = SELECT.from(TimeSheetDetails, ts => {
            ts('*'); // Select all fields from TimeSheetDetails
            ts.ItsAllowances(a => a('*')); // Select all fields from ItsAllowances association
          }).where(whereclause);

          const TimesheetData = await tx.run(TimeSheetQuery);
          // Create hash maps for quick lookup
          const EmployeeDataMap = Utilities.generateHashMapArray(AbsenceData, "EmployeeID");
          const TimesheetDataMap1 = Utilities.generateHashMapArray(TimesheetData, "EmployeeID");
          const TimesheetDataMap2 = Utilities.generateHashMapArray(TimesheetData, "EmpUserEmail");
          const createData = [];
          const queries = [];
          EmployeeIDs.forEach(empID => {
            const EmployeeECData = (EmployeeDataMap.get(empID) || []).filter((item, _, arr) => {
              const sameDateStatuses = arr.filter(obj => obj.Date === item.Date).map(obj => obj.ApprovalStatus);
              // Keep the object if it's not Cancelled/Declined, or if there's no Pending/Approved for the same date
              return (
                ['PENDING', 'APPROVED'].includes(item.ApprovalStatus) ||
                !sameDateStatuses.some(status => ['PENDING', 'APPROVED'].includes(status))
              );
            });;
            const EmployeeTimesheetData = TimesheetDataMap1.get(empID) || TimesheetDataMap2.get(empID) || [];

            EmployeeTimesheetData.forEach(item => {
              let updateItem = {};

              if (!EmployeeECData.find(obj => obj.Date === item.Date) && item.LeaveCode !== '' && item.WorkType != 'Absent' && item.Status === 'Approved') {
                updateItem = { Status: "Open", Absence: item.RegularHours === '0' ? "Week-Off" : "", LeaveCode: "", ItsAllowances: [] };
              }

              if (Object.keys(updateItem).length > 0) {
                const query = UPDATE(TimeSheetDetails)
                  .set(updateItem)
                  .where({
                    ID: item.ID,
                    EmployeeID: item.EmployeeID,
                    AppID: item.AppID,
                    Date: item.Date,
                    WbsCode: item.WbsCode,
                    InternalOrder: item.InternalOrder,
                    CostCenter: item.CostCenter
                  });
                queries.push(query);
              }

            });

            EmployeeECData.forEach(absence => {
              const ValidAssignments = EmployeeTimesheetData.filter(obj => obj.StartDate <= absence.Date && obj.EndDate >= absence.Date && obj.AppID === 'PROALO')

              let itemTimeSheets = EmployeeTimesheetData.filter(obj => absence.Date === obj.Date);

              if (itemTimeSheets.length !== ValidAssignments.length) {
                ValidAssignments.forEach(el => {
                  if (!itemTimeSheets.find(obj => obj.ProjectCode === el.ProjectCode) && !["CANCELLED", "REJECTED"].includes(absence.ApprovalStatus)) {
                    let { __metadata, ID, createdAt, modifiedAt, createdBy, modifiedBy, ...copy } = el;

                    const createItem = {
                      ...copy,
                      AppID: "EMPTIM",
                      Date: absence.Date,
                      Absence: absence?.Reason ?? "",
                      LeaveCode: absence?.LeaveCode ?? "",
                      WorkType: "",
                      WorkedHours: "0.00",
                      TotalHours: "0.00",
                      TotalAmount: "0.00",
                      ItsAllowances: [],
                      Status: "Approved"
                    };
                    createData.push(createItem);
                  }
                });
              }

              itemTimeSheets.forEach(item => {
                let updateItem = {};
                if (item.AppID === 'EMPTIM') {
                  // Handle cancelled absences
                  if (!["CANCELLED", "REJECTED"].includes(absence.ApprovalStatus) && absence?.LeaveCode !== item.LeaveCode && (item.Status === "Leave" || (item.Status === "Approved" && (!item.WorkType || item.WorkType === 'Absent') && item.LeaveCode))) {
                    updateItem = {
                      Absence: absence?.Reason ?? "",
                      LeaveCode: absence?.LeaveCode ?? "",
                      WorkType: "",
                      WorkedHours: "0.00",
                      TotalHours: "0.00",
                      TotalAmount: "0.00",
                      ItsAllowances: [],
                      Status: "Approved"
                    }
                    if(item?.WorkType === 'Absent'){
                      // is unauth and unauth alowance found
                      const unauth = item?.ItsAllowances?.find(obj => obj.AllowanceID === '3007' && obj.Reversed !== 'X' && obj.HistoryRecord !== 'X')
                      if(unauth){
                        const allowanceList = [...item?.ItsAllowances, {
                          ...unauth,
                          Status: "Not yet Replicated",
                          Reversed: 'X',
                          ErrorIndicator: 'X'
                        }];
                        updateItem = {
                          ...updateItem,
                          ItsAllowances : allowanceList
                        }
                      }
                    }
                  }
                  if (["CANCELLED", "REJECTED"].includes(absence.ApprovalStatus) && (item.Status === "Leave" || (item.Status === "Approved" && !item.WorkType && item.LeaveCode))) {
                    updateItem = { Status: "Open", Absence: item.RegularHours === '0' ? "Week-Off" : "", LeaveCode: "", ItsAllowances: [] };
                  }
                  // Handle open or draft timesheets
                  else if (!["CANCELLED", "REJECTED"].includes(absence.ApprovalStatus) && (item.Status === "Open" || item.Status === "Draft")) {
                    updateItem = {
                      Absence: absence?.Reason ?? "",
                      LeaveCode: absence?.LeaveCode ?? "",
                      WorkType: "",
                      WorkedHours: "0.00",
                      TotalHours: "0.00",
                      TotalAmount: "0.00",
                      ItsAllowances: [],
                      Status: "Approved"
                    };
                  }

                  if (Object.keys(updateItem).length > 0) {
                    const query = UPDATE(TimeSheetDetails)
                      .set(updateItem)
                      .where({
                        ID: item.ID,
                        EmployeeID: item.EmployeeID,
                        AppID: item.AppID,
                        Date: item.Date,
                        WbsCode: item.WbsCode,
                        InternalOrder: item.InternalOrder,
                        CostCenter: item.CostCenter
                      });
                    queries.push(query);
                  }
                }
              });
            });

          });


            const createQuery = srv.create(TimeSheetDetails).entries(createData);
            if (createData.length > 0) queries.push(createQuery);
            await tx.run([...queries]);
        
        
          await tx.commit(); // Commit the transaction (unlock the records)
      } catch (err) {
        console.error(err);
        await tx.rollback(); // Rollback the transaction if something fails
        throw err; // Rethrow the error to handle it outside
      }
    };

    const calculateOT = function (allowanceECL, sValue) {

      let OvertimeCalc = 0;

      let ECAllowances = [];

      allowanceECL.forEach(EC => {

        ECAllowances[EC.AllowanceID] = EC;

      });

      let comp1000 = ECAllowances[1000] ? parseInt(ECAllowances[1000].Amount) : 0;

      let comp1015 = ECAllowances[1015] ? parseInt(ECAllowances[1015].Amount) : 0;

      let comp1025 = ECAllowances[1025] ? parseInt(ECAllowances[1025].Amount) : 0;



      OvertimeCalc = comp1000 * 1.5;  // step1

      OvertimeCalc = OvertimeCalc + comp1015 + comp1025;  //step2

      OvertimeCalc = OvertimeCalc * 12;

      OvertimeCalc = OvertimeCalc / 2920;

      OvertimeCalc = OvertimeCalc * parseFloat(sValue);

      return OvertimeCalc.toFixed(2).toString();

    };

    const calculateOTAMPS = function (AMPSOvertime, loc, allowanceECL, sValue, allowanceCode) {
      let ECAllowances = [];

      allowanceECL.forEach(EC => {
        ECAllowances[EC.AllowanceID] = EC;
      });

      let comp1000 = ECAllowances[1000] ? parseFloat(ECAllowances[1000].Amount) : 0;

      let OToffSet = 0;

      let tempOTformla = AMPSOvertime.find(({ Location }) => Location === loc);


      if (allowanceCode === "4003") {
        OToffSet = tempOTformla ? parseFloat(tempOTformla.Holiday) : 1.5;
      } else if (allowanceCode === "4002") { // WeekOFF
        OToffSet = tempOTformla ? parseFloat(tempOTformla.WeekOff) : 1.5;
      } else if (allowanceCode === "4001") {  // Weekdays
        OToffSet = tempOTformla ? parseFloat(tempOTformla.Normal) : 1.25;
      } else if (allowanceCode === "4004") { // Night Hours
        OToffSet = tempOTformla?.Night ? parseFloat(tempOTformla.Night) : 1;
      }

      let amount = (comp1000 / 240) * OToffSet * parseFloat(sValue);
      return amount.toFixed(2).toString();

    }
    const UpdateAllowances = async (AllowanceData, maintenanceData, cutOffStartDate, cutOffEndDate) => {
      const tx = cds.transaction(); // Start a new transaction
      const { updateEmployees } = maintenanceData;

      try {
        const { OvertimeEligibility,
          AllowanceEligibility,
          AMPSCodes,
          OvertimeException,
          AMPSOvertime } = maintenanceData;
        let EmployeeIDs = [...new Set(AllowanceData.map(employee => employee.EmployeeID))];
        if (updateEmployees.length > 0) {
          EmployeeIDs = EmployeeIDs.filter(obj => updateEmployees.includes(obj));
        }
        const AllowancesECPCodes = [...new Set(AllowanceData.map(allowance => allowance.AllowanceID))];
        const AllowanceCodes = AllowanceEligibility
          .filter(eligibility => AllowancesECPCodes.includes(eligibility.HanaID))
          .map(eligibility => eligibility.AllowanceID);

        const dependentAllowanceCodes = AllowanceEligibility.filter(obj => obj.Amount === "");

        const set2 = new Set(dependentAllowanceCodes);
        const intersectingCodes = AllowanceCodes.filter(value => set2.has(value));

        const { adjustedStartDate, adjustedEndDate } = Utilities.getAdjustedDates(AllowanceData, "StartDate", "EndDate", cutOffStartDate, cutOffEndDate);

        const getWhereClause = (appid, d1, d2) => {
          return `
          ((AppID = '${appid}' OR AppID = 'PROALONOR') AND
          (
            (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
            (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
            (StartDate <= '${d1}' AND EndDate >= '${d2}')
          )) OR
         ((AppID = 'EMPTIM') AND (Date >= '${d1}' AND Date <= '${d2}'))
        `;

        }
        const whereclause = getWhereClause("PROALO", adjustedStartDate, adjustedEndDate);
        let TimesheetQuery = SELECT.from(TimeSheetDetails, ts => {
          ts.ID,
            ts.EmployeeID,
            ts.WbsCode,
            ts.InternalOrder,
            ts.AppID,
            ts.CostCenter,
            ts.EmpUserEmail,
            ts.Department,
            ts.CompanyCode,
            ts.Date,
            ts.Location,
            ts.ItsAllowances(a => a`.*`);
        }).where(whereclause);



        let AllowancesData = await TimesheetQuery;

        // Create hash maps for quick lookup
        const ECallowances = Utilities.generateHashMapArray(AllowanceData, "EmployeeID");
        const AllowanceDataMap1 = Utilities.generateHashMapArray(AllowancesData, "EmployeeID");
        const AllowanceDataMap2 = Utilities.generateHashMapArray(AllowancesData, "EmpUserEmail");

        const codesApplicableNotMaintained = ["1076", "1180", "4058", "4051", "4011", "4029", "4070", "4036"];

        const codeMapping = {
          "1180": {
            code: "1070",
            offset: 0.5
          },
          "1076": {
            code: "1070",
            offset: 0.5
          },
          "4058": {
            code: "1073",
            offset: 0.25
          },
          "4051": {
            code: "1071",
            offset: 0.25
          },
          "4011": {
            code: "1071",
            offset: 0.25
          },
          "4029": {
            code: "1071",
            offset: 0.35
          },
          "4070": {
            code: "1075",
            offset: 0.25
          },
          "4036": {
            code: "1072",
            offset: 0.25
          }

        }
        let queries = [];
        EmployeeIDs.forEach(empID => {

          const ECAllowanceChanges = ECallowances.get(empID) || [];
          const EmpAllowancesECPCodes = [...new Set(ECAllowanceChanges.map(allowance => allowance.AllowanceID))];
          const TimeSheetEntries = AllowanceDataMap1.get(empID) || AllowanceDataMap2.get(empID) || []

          const AllowanceCodes = AllowanceEligibility
            .filter(eligibility => EmpAllowancesECPCodes.includes(eligibility.HanaID))
            .map(eligibility => eligibility.AllowanceID);

          // const ElligibleAllowance = AllowanceEligibility.filter(({CompanyCode, Department}) => (Employee.CompanyCode === CompanyCode || Employee.Department === Department || (CompanyCode === "" && Department === "")))

          const overTimeCodes = ["9000", "4001", "4002", "4003", "4004"];
          const HousingAllowanceCodes = ["1000", "1015", "1025"];

          if (empID === "32746") {
            console.log("")
          }

          TimeSheetEntries.forEach(TimeSheetEntry => {

            const itemLevelChanges = ECAllowanceChanges.filter(obj => TimeSheetEntry.Date >= obj.StartDate && TimeSheetEntry.Date <= obj.EndDate)
            const itemLevelECCodes = [...new Set(itemLevelChanges.map(allowance => allowance.AllowanceID))];

            const itemLevelInfo = AllowanceEligibility.filter(({ HanaID, CompanyCode, Department }) => itemLevelECCodes.includes(HanaID) &&
              (TimeSheetEntry.CompanyCode === CompanyCode || TimeSheetEntry.Department === Department || (CompanyCode === "" && Department === "")));
            const itemLevelCodes = itemLevelInfo.map(eligibility => eligibility.AllowanceID);

            if (itemLevelChanges.length === 0) return;

            const ItsAllowances = TimeSheetEntry.ItsAllowances;
            if (TimeSheetEntry.Date === "2024-10-18") {
              console.log("")
            }
            if (ItsAllowances.length === 0 || !ItsAllowances.find(obj => obj.Reversed === "" && obj.HistoryRecord === "")) return;

            const isAMPS = AMPSCodes.includes(TimeSheetEntry.CompanyCode);
            const Location = TimeSheetEntry.Location;

            // if ( !(itemLevelChanges.find(obj => HousingAllowanceCodes.includes(obj.AllowanceID)) && ItsAllowances.find(obj => overTimeCodes.includes(obj.AllowanceID))) && 
            // !ItsAllowances.find(obj => AllowanceCodes.concat(codesApplicableNotMaintained).includes(obj.AllowanceID) && !overTimeCodes.includes(obj.AllowanceID)) 
            // ) return;

            let isEditted = false;

            ItsAllowances.forEach(allowance => {

              if (allowance.Reversed === "X" || allowance.HistoryRecord === "X") return;

              // OT calculation
              let HousingAllowance = itemLevelChanges.find(obj => HousingAllowanceCodes.includes(obj.AllowanceID) && obj.StartDate <= allowance.Date && obj.EndDate >= allowance.Date);
              if (overTimeCodes.includes(allowance.AllowanceID) && HousingAllowance) {
                if (isAMPS) {
                  isEditted = true;
                  allowance.Amount = calculateOTAMPS(AMPSOvertime, Location, itemLevelChanges, allowance.Number, allowance.AllowanceID);
                } else {
                  isEditted = true;
                  allowance.Amount = calculateOT(itemLevelChanges, allowance.Number);
                }
              }

              const aInfo = itemLevelInfo.find(obj => obj.AllowanceID === allowance.AllowanceID)
              const ECID = aInfo?.HanaID;
              const AllowanceInfo = itemLevelChanges.find(obj => obj.AllowanceID === ECID);

              if (itemLevelCodes.includes(allowance.AllowanceID)) {
                if (ECID && AllowanceInfo && aInfo.Amount === '') {
                  isEditted = true;
                  allowance.Amount = AllowanceInfo.Amount;
                }
              }

              if (allowance.AllowanceID === "9060") {
                console.log("")
              }


              if (codesApplicableNotMaintained.includes(allowance.AllowanceID) || (ECID && codesApplicableNotMaintained.includes(ECID))) {
                const mapping = codeMapping[allowance.AllowanceID] || codeMapping[ECID];
                const dependentAllowance = itemLevelChanges.find(obj => obj.AllowanceID === mapping?.code);
                if (mapping && dependentAllowance) {
                  isEditted = true;
                  allowance.Amount = (parseFloat(dependentAllowance.Amount || 0) * mapping.offset).toFixed(2).toString();
                }
              }




            });


            if (isEditted) {
              const query = UPDATE(TimeSheetDetails)
                .set({ ItsAllowances })
                .where({
                  ID: TimeSheetEntry.ID,
                  EmployeeID: TimeSheetEntry.EmployeeID,
                  AppID: TimeSheetEntry.AppID,
                  Date: TimeSheetEntry.Date,
                  WbsCode: TimeSheetEntry.WbsCode,
                  InternalOrder: TimeSheetEntry.InternalOrder,
                  CostCenter: TimeSheetEntry.CostCenter
                });
              queries.push(query);
            }

          });


        });


        // Execute all queries within the transaction
        // for (let query of queries) {
        //   await tx.run(query); // Run each update in the same transaction
        // }

        await tx.run([...queries]);

        await tx.commit(); // Commit the transaction (unlock the records)
      } catch (err) {
        await tx.rollback(); // Rollback the transaction if something fails
        throw err; // Rethrow the error to handle it outside
      }
    }

    function splitProject(project, records) {
      // Sort records by their effective start dates
      records.sort((a, b) => a.EffectiveStartDate.localeCompare(b.EffectiveStartDate));
      const { InternalOrder, InternalOrderDesc, CostCenter, CostCenterDesc, WbsCode, WbsCodeDesc, ProjectCode, ProjectDesc } = project;
      let result = [];
      let currentStart = project.StartDate;

      for (const record of records) {
        let { EffectiveStartDate, EffectiveEndDate, RawbalanceAMPS, ...rest } = record; // Exclude specific keys
        rest.RotationalLeaveBalance = RawbalanceAMPS;
        // Check if the record overlaps with the project date range
        if (record.EffectiveEndDate >= currentStart && record.EffectiveStartDate <= project.EndDate) {

          // If there is a gap before the current overlap, add it as a separate period
          if (record.EffectiveStartDate > currentStart) {
            result.push({
              ...rest,  // Include all original properties of record
              StartDate: currentStart,
              EndDate: getPreviousDate(record.EffectiveStartDate),
              AppID: project.AppID,
              Date: "",
            });
          }

          // Add the overlapping period
          const overlapStart = maxDate(currentStart, record.EffectiveStartDate);
          const overlapEnd = minDate(project.EndDate, record.EffectiveEndDate);
          result.push({
            ...rest,
            InternalOrder, InternalOrderDesc, CostCenter, CostCenterDesc, WbsCode, WbsCodeDesc, ProjectCode, ProjectDesc,
            StartDate: overlapStart,
            EndDate: overlapEnd,
            AppID: project.AppID,
            Date: "",
          });

          // Update currentStart to the end of the overlap +1 day
          currentStart = getNextDate(overlapEnd);
        }
      }

      // If there's any remaining time after the last record, add it as a final segment
      if (currentStart <= project.EndDate) {
        let { EffectiveStartDate, EffectiveEndDate, RawbalanceAMPS, ...lastRecordProps } = records[records.length - 1]; // Exclude specific keys
        lastRecordProps.RotationalLeaveBalance = RawbalanceAMPS;
        result.push({
          StartDate: currentStart,
          InternalOrder, InternalOrderDesc, CostCenter, CostCenterDesc, WbsCode, WbsCodeDesc, ProjectCode, ProjectDesc,
          EndDate: project.EndDate,
          AppID: project.AppID,
          Date: "",
          ...lastRecordProps  // Use properties from the last record
        });
      }

      return result;
    }

    const getUnavailableDates = (employees, startDate, endDate) => {
      // Parse the startDate and endDate
      const start = startDate;
      const end = endDate;

      // Step 1: Filter employees overlapping the date range
      const overlappingRecords = employees.filter(({ EffectiveStartDate, EffectiveEndDate }) => {
        const recordStart = EffectiveStartDate;
        const recordEnd = EffectiveEndDate;
        return recordStart <= end && recordEnd >= start;
      });

      // Step 2: Create an array to store all unavailable dates
      const unavailableDates = [];

      // Step 3: Iterate through each date in the range
      for (let date = new Date(start + "T00:00:00"); date <= new Date(end + "T00:00:00"); date.setDate(date.getDate() + 1)) {
        const isCovered = overlappingRecords.some(({ EffectiveStartDate, EffectiveEndDate }) => {
          const recordStart = new Date(EffectiveStartDate + "T00:00:00");
          const recordEnd = new Date(EffectiveEndDate + "T00:00:00");
          return date >= recordStart && date <= recordEnd;
        });

        // If the date is not covered by any record, add it to unavailableDates
        if (!isCovered) {
          unavailableDates.push(new Date(date)); // Clone the date
        }
      }

      return unavailableDates.map(d => Utilities.formatDate(d)); // Format dates as yyyy-mm-dd
    }

    function splitProjectspecial(project, records) {
      // Sort records by their effective start dates
      records.sort((a, b) => a.EffectiveStartDate.localeCompare(b.EffectiveStartDate));
      const { InternalOrder, InternalOrderDesc, CostCenter, CostCenterDesc, WbsCode, WbsCodeDesc, ProjectCode, ProjectDesc } = project;
      let result = [];
      let currentStart = project.StartDate;

      for (const record of records) {
        let { EffectiveStartDate, EffectiveEndDate, RawbalanceAMPS, ...rest } = record; // Exclude specific keys
        rest.RotationalLeaveBalance = RawbalanceAMPS;

        // Check if the record overlaps with the project date range
        if (record.EffectiveEndDate >= currentStart && record.EffectiveStartDate <= project.EndDate) {

          // If there is a gap before the current overlap, skip the gap
          if (record.EffectiveStartDate > currentStart) {
            currentStart = record.EffectiveStartDate; // Move to the start of the next valid range
          }

          // Add the overlapping period
          const overlapStart = maxDate(currentStart, record.EffectiveStartDate);
          const overlapEnd = minDate(project.EndDate, record.EffectiveEndDate);
          result.push({
            ...rest,
            InternalOrder, InternalOrderDesc, CostCenter, CostCenterDesc, WbsCode, WbsCodeDesc, ProjectCode, ProjectDesc,
            StartDate: overlapStart,
            EndDate: overlapEnd,
            AppID: project.AppID,
            Date: "",
          });

          // Update currentStart to the end of the overlap + 1 day
          currentStart = getNextDate(overlapEnd);
        }
      }

      return result;
    }
    // Helper functions
    function getPreviousDate(dateString) {
      const date = new Date(dateString + "T00:00:00");
      date.setDate(date.getDate() - 1);
      return Utilities.formatDate(date);
    }

    function getNextDate(dateString) {
      const date = new Date(dateString + "T00:00:00");
      date.setDate(date.getDate() + 1);
      return Utilities.formatDate(date);
    }

    function maxDate(date1, date2) {
      return date1 > date2 ? date1 : date2;
    }

    function minDate(date1, date2) {
      return date1 < date2 ? date1 : date2;
    }

    const createUpdateQueriesForProject = (project, ECobject, EmployeeTimesheetData, workingDays, Holidays) => {
      const timesheetdata = EmployeeTimesheetData.filter(obj => obj.Date >= project.StartDate
        && obj.Date <= project.EndDate
        && obj.ProjectCode === project.ProjectCode);
      const queries = [];
      const { EffectiveStartDate, EffectiveEndDate, EmployeeID, ...projectCopy } = ECobject;
      timesheetdata.forEach(timesheet => {
        let updateItem = { ...projectCopy, StartDate: project.StartDate, EndDate: project.EndDate };
        if (timesheet.Workschedule !== project.Workschedule) {
          const dayOfWeek = new Date(timesheet.Date + "T00:00:00").getDay();
          const offsetDayOfWeek = (dayOfWeek + 6) % 7;
          const workingHours = workingDays?.WorkingHours[offsetDayOfWeek];

          if (workingHours === '0' && timesheet.LeaveCode === "") {
            updateItem.Absence = "Week-Off";
          }
          if (workingHours !== '0' && timesheet.Absence === "Week-Off") {
            updateItem.Absence = "";
          }
          updateItem.RegularHours = workingHours;
          if (project.EmployeeIs === "Rotational") {
            if (timesheet.EmployeeIs === "Regular" && timesheet.Status === "Approved"); // post new balance
            else if (timesheet.EmployeeIs === "Rotational" && timesheet.Status === "Approved"); // edit old balance with new one
          }

          if (project.EmployeeIs === "Regular" && timesheet.EmployeeIs === "Rotational"); // remove leave balance
        }
        // if (timesheet.Country !== project.Country) {
        const holiday = Holidays.find(obj => obj.Date === timesheet.Date);
        if (holiday && timesheet.LeaveCode === "") {
          updateItem.Absence = holiday.Name;
        }
        // }

        const query = UPDATE(TimeSheetDetails)
          .set({ ...updateItem })
          .where({
            ID: timesheet.ID,
            EmployeeID: timesheet.EmployeeID,
            AppID: timesheet.AppID,
            Date: timesheet.Date,
            WbsCode: timesheet.WbsCode,
            InternalOrder: timesheet.InternalOrder,
            CostCenter: timesheet.CostCenter
          });
        queries.push(query);
      });

      return queries;

    };
    // Function to split EmployeeIDs into chunks






    const UpdateTimesheet = async (EmployeeData, cutOffStartDate, cutOffEndDate, maintenanceData) => {

      const tx = cds.transaction(); // Start a new transaction

      const { updateEmployees } = maintenanceData;

      try {
        let createQueries = [];
        let EmployeeIDs = [...new Set(EmployeeData.map(employee => employee.EmpUserEmail))]; // get unique here
        if (updateEmployees.length > 0) {
          EmployeeIDs = EmployeeIDs.filter(obj => updateEmployees.includes(obj));
        }

        console.log("EMPLOYEES GOING FOR UPDATE - ", EmployeeIDs);

        let Workschedules = [...new Set(EmployeeData.map(employee => employee.Workschedule))];

        let EmpJobkey = "Empjob", AbsenceKey = "Absence", Allowancekey = "Allowance",
          workscheduleKey = "Workschedule", HolidayKey = "Holiday", perpersonKey = "perperson";




        const WorkScheduleRawData = await Utilities.getSFData(
          oURLSettings[workscheduleKey].getBaseURL(),
          oURLSettings[workscheduleKey].getFilter(Workschedules, "externalCode"),
          {},
          oURLSettings[workscheduleKey].getExpand()
        );

        const WorkScheduleData = oURLSettings[workscheduleKey].mapData(WorkScheduleRawData);

        const HolidaysRawdata = await Utilities.getSFData(
          oURLSettings[HolidayKey].getBaseURL(),
          oURLSettings[HolidayKey].getFilter(),
          {},
          oURLSettings[HolidayKey].getExpand()
        );

        const Holidays = oURLSettings[HolidayKey].mapData(HolidaysRawdata);



        const { adjustedStartDate, adjustedEndDate } = Utilities.getAdjustedDates(EmployeeData, "EffectiveStartDate", "EffectiveEndDate", cutOffStartDate, cutOffEndDate);

        // Define date filters using object literals, as specified in CAP
        const dateFilterPROALO = {
          StartDate: { '>=': adjustedStartDate, '<=': adjustedEndDate },
          or: { EndDate: { '>=': adjustedStartDate, '<=': adjustedEndDate } },
          or: { StartDate: { '<=': adjustedStartDate }, EndDate: { '>=': adjustedEndDate } }
        };

        const dateFilterEMPTIM = { Date: { between: [adjustedStartDate, adjustedEndDate] } };

        const getWhereClause = (appid, d1, d2) => {
          return `
          ((AppID = '${appid}' OR AppID = 'PROALONOR') AND
          (
            (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
            (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
            (StartDate <= '${d1}' AND EndDate >= '${d2}')
          )) OR
         ((AppID = 'EMPTIM') AND (Date >= '${d1}' AND Date <= '${d2}'))
        `;

        }
        const whereclause = getWhereClause("PROALO", adjustedStartDate, adjustedEndDate);
        const TimeSheetQuery = SELECT.from(TimeSheetDetails, ts => {
          ts('*'); // Select all fields from TimeSheetDetails
          ts.ItsAllowances(a => a('*')); // Select all fields from ItsAllowances association
        }).where(whereclause);

        const TimesheetData = await TimeSheetQuery;

        // const TimesheetData = await fetchTimesheetData(EmployeeIDs, adjustedStartDate, adjustedEndDate);

        const EmployeeDataMap = Utilities.generateHashMapArray(EmployeeData, "EmpUserEmail");
        const TimesheetDataMap1 = Utilities.generateHashMapArray(TimesheetData, "EmployeeID");
        const TimesheetDataMap2 = Utilities.generateHashMapArray(TimesheetData, "EmpUserEmail");


        // const keysList1 =  Array.from(TimesheetDataMap1.keys());
        // const keysList2 =  Array.from(TimesheetDataMap2.keys());
        // const combinedKeysList = [...new Set([...keysList1, ...keysList2])];
        // const otherSet = new Set(EmployeeIDs);

        // const intersectionList = combinedKeysList.filter(key => otherSet.has(key));









        let queries = [];

        EmployeeIDs.forEach(empID => {

          const EmployeeECData = EmployeeDataMap.get(empID);
          const EmployeeTimesheetData = TimesheetDataMap1.get(empID) || TimesheetDataMap2.get(empID) || [];

          if (EmployeeTimesheetData.length > 0) {
            console.log("pause here ");
          }
          const Projects = EmployeeTimesheetData.filter(({ AppID }) => AppID === 'PROALO' || AppID === 'PROALONOR');

          Projects.forEach(project => {


            const EcObjects = EmployeeECData.filter(obj => (obj.EffectiveStartDate <= project.EndDate && obj.EffectiveEndDate >= project.StartDate)).filter((item, index, self) =>
              index === self.findIndex((t) => (
                t.EffectiveStartDate === item.EffectiveStartDate && t.EffectiveEndDate === item.EffectiveEndDate
              ))
            );;

            const unavailableDates = getUnavailableDates(EcObjects, project.StartDate, project.EndDate);

            if (EcObjects.length === 1 && unavailableDates.length === 0) {
              const WorkingHoursData = WorkScheduleData.find(({ Workschedule }) => Workschedule === EcObjects[0].Workschedule);
              const HolidayData = Holidays.filter(({ Country }) => Country === EcObjects[0].Country);

              let { EffectiveStartDate, EffectiveEndDate, EmployeeID, RawbalanceAMPS, ...projectCopy } = EcObjects[0];
              projectCopy["RotationalLeaveBalance"] = RawbalanceAMPS;

              let updateProjectQuery = UPDATE(TimeSheetDetails)
                .set({ ...projectCopy, EndDate: project.EndDate })
                .where({
                  ID: project.ID,
                  EmployeeID: project.EmployeeID,
                  AppID: project.AppID,
                  Date: project.Date,
                  WbsCode: project.WbsCode,
                  InternalOrder: project.InternalOrder,
                  CostCenter: project.CostCenter
                });
              queries.push(updateProjectQuery);
              const newQueries = createUpdateQueriesForProject({ ...project, ...EcObjects[0] }, EcObjects[0], EmployeeTimesheetData, WorkingHoursData, HolidayData);
              queries = [...queries, ...newQueries];


            }

            else if (EcObjects.length > 1 || (EcObjects.length === 1 && unavailableDates.length > 0)) {


              const newProjects = unavailableDates.length > 0 ? splitProjectspecial(project, EcObjects) : splitProject(project, EcObjects);
              // add delete query
              const delimitQuery = UPDATE(TimeSheetDetails)
                .set({ DELETED: true })
                .where({
                  ID: project.ID,
                  EmployeeID: project.EmployeeID,
                  AppID: project.AppID,
                  Date: project.Date,
                  WbsCode: project.WbsCode,
                  InternalOrder: project.InternalOrder,
                  CostCenter: project.CostCenter
                });
              queries.push(delimitQuery);
              //create query

              if (unavailableDates.length > 0) {
                const timesheetdata = EmployeeTimesheetData.filter(obj =>
                  unavailableDates.includes(obj.Date) && obj.ProjectCode === project.ProjectCode
                );

                const delQueries = timesheetdata.map(obj =>
                  UPDATE(TimeSheetDetails)
                    .set({ DELETED: true })
                    .where({
                      ID: obj.ID,
                      EmployeeID: obj.EmployeeID,
                      AppID: obj.AppID,
                      Date: obj.Date,
                      WbsCode: obj.WbsCode,
                      InternalOrder: obj.InternalOrder,
                      CostCenter: obj.CostCenter
                    })
                );
                queries = [...queries, ...delQueries];

              }

              const createQuery = srv.create(TimeSheetDetails).entries(newProjects);
              queries.push(createQuery);

              newProjects.forEach(item => {
                const WorkingHoursData = WorkScheduleData.find(({ Workschedule }) => Workschedule === item.Workschedule);
                const HolidayData = Holidays.filter(({ Country }) => Country === item.Country);
                const EcObject = EcObjects.find(({ EffectiveStartDate, EffectiveEndDate }) => EffectiveStartDate <= item.StartDate && EffectiveEndDate >= item.EndDate);

                const newQueries = createUpdateQueriesForProject({ ...item, ...EcObject }, EcObject, EmployeeTimesheetData, WorkingHoursData, HolidayData);
                queries = [...queries, ...newQueries];
              });

            }




          });

        });

        await tx.run([...queries]);

        await tx.commit(); // Commit the transaction (unlock the records)

      } catch (err) {
        await tx.rollback(); // Rollback the transaction if something fails
        throw err; // Rethrow the error to handle it outside
      }









    }

    async function fetchEmployeeDataInBatches(EmployeeIDs, oURLSettings, perpersonKey) {
      const BATCH_SIZE = 100;
      const results = [];

      // Split EmployeeIDs into chunks of 100
      for (let i = 0; i < EmployeeIDs.length; i += BATCH_SIZE) {
        const batch = EmployeeIDs.slice(i, i + BATCH_SIZE);

        // Get filter for current batch
        const filter = oURLSettings[perpersonKey].getFilter(batch);

        // Fetch data for the current batch
        const batchData = await Utilities.getSFData(
          oURLSettings[perpersonKey].getBaseURL(),
          filter,
          {},
          oURLSettings[perpersonKey].getExpand()
        );

        const absenceData = oURLSettings[AbsenceKey].mapData(batchData);

        if (batchData.length > 0) await UpdateLeaveRecords(absenceData, cutOffStartDate, cutOffEndDate, maintenanceData);
  

        // Combine results
      }

      return results;
    }

    // };
    let EmpJobkey = "Empjob", AbsenceKey = "Absence", Allowancekey = "Allowance"
    workscheduleKey = "Workschedule", HolidayKey = "Holiday", perpersonKey = "perperson";

    const tx = cds.transaction(); // Start a new transaction

    try {
      // const employeeRAWData = await Utilities.getSFData(
      //   oURLSettings[EmpJobkey].getBaseURL(),
      //   oURLSettings[EmpJobkey].getNewFilter(),
      //   { "fromDate": "1900-01-01" },
      //   oURLSettings[EmpJobkey].getExpand(),
      //   oURLSettings[EmpJobkey].getSelect(),
      //   oURLSettings[EmpJobkey].getOrderBy(),
      // );

      // let EmployeeData = oURLSettings[EmpJobkey].mapData(employeeRAWData, AMPSCodes);
      // let EmployeeIDs = [...new Set(EmployeeData.map(employee => employee.EmployeeID))];

      if(CompanyCodes.length > 0){
        const employeeRAWData = await Utilities.getSFData(
          oURLSettings[EmpJobkey].getBaseURL(),
          oURLSettings[EmpJobkey].getFilter(CompanyCodes),
          { "fromDate": "1900-01-01" },
          "",
          "userId",
          "",
        );
        const companycodeIDs = [... new Set(employeeRAWData.map(obj => obj.userId))];
        updateEmployees.push(...companycodeIDs);
      }
      
      // const pernerRawData = await fetchEmployeeDataInBatches(EmployeeIDs, oURLSettings, perpersonKey)


      // const pernerData = oURLSettings[perpersonKey].mapData(pernerRawData);

      // const pernerMap = Utilities.generateHashMapArray(pernerData, "EmployeeID");

      // EmployeeData = Utilities.updateArrayonPerPerson(EmployeeData, "EmployeeID", pernerData);

      // if (employeeRAWData.length > 0) await UpdateTimesheet(EmployeeData, cutOffStartDate, cutOffEndDate, maintenanceData);


      const absenceDataRaw = await fetchEmployeeDataInBatches(updateEmployees, oURLSettings, AbsenceKey)

      // const absenceDataRaw = await Utilities.getSFData(
      //   oURLSettings[AbsenceKey].getBaseURL(),
      //   oURLSettings[AbsenceKey].getNewFilter(),
      //   { "fromDate": "1900-01-01" },
      //   oURLSettings[AbsenceKey].getExpand()
      // );

      // const absenceData = oURLSettings[AbsenceKey].mapData(absenceDataRaw);

      // if (absenceDataRaw.length > 0) await UpdateLeaveRecords(absenceData, cutOffStartDate, cutOffEndDate, maintenanceData);

      // const allowanceRaw = await Utilities.getSFData(
      //   oURLSettings[Allowancekey].getBaseURL(),
      //   oURLSettings[Allowancekey].getNewFilter(),
      //   { "fromDate": "1900-01-01" },
      //   oURLSettings[Allowancekey].getExpand()
      // );

      // const AllowanceData = oURLSettings[Allowancekey].mapData(allowanceRaw);

      // if (allowanceRaw.length > 0) await UpdateAllowances(AllowanceData, maintenanceData, cutOffStartDate, cutOffEndDate);


      const { lastRunDateUpdate } = maintenanceData;
      const [udate, utime] = currentDateTime.split("T")
      const UpdateQuery = UPDATE(RowInfo).set({ Column1: udate, Column2: utime }).where({ ID: lastRunDateUpdate.ID })
      await tx.run(UpdateQuery);
      await tx.commit();
      return;

    } catch (err) {
      await tx.rollback(); // Rollback the transaction if something fails
      throw err // Rethrow the error to handle it outside
    }




  });

  this.on("GET", "MasterDataUpdateOld", async (req, next) => {

    const Utilities = {
      convertToDateString: (dateString) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      constructURL: (baseURL, filter, parameters, expand = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}` : baseURL;

        return fullURL;
      },

      getSFData: async (baseURL, filter, parameters, expand) => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand);
        const batchSize = 1000; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}&$top=${batchSize}&$skip=${skip}`;

          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            data = data.concat(SFdata);

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error : " + error);
            break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
      convertToDate: (dateString) => {
        const timestamp = parseInt(dateString.match(/\/Date\((\d+)\)\//)[1], 10);
        return new Date(timestamp);
      },
      formatDate: (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      },
      generateDates: function (startDate, endDate, format = 1) {

        let currentDate = new Date(startDate);
        let datesArray = [];

        while (currentDate <= endDate) {
          datesArray.push(Utilities.formatDate(currentDate, format));
          // Incrementing currentDate
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return datesArray;
      }
    };

    let srv = cds.services['taqa.srv.TaqaDbService'];

    const sapAxios = require('sap-cf-axios').default;
    const sf = sapAxios("SF");


    const { TimeSheetDetails, LineManagerApproverTable } = cds.entities('taqa.srv.TaqaDbService');

    const formatDate = (date, format = 1) => {

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      if (format === 1) return `${year}-${month}-${day}`;
      else if (format === 2) return `${day}-${month}-${year}`;
      else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
      else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
    };

    const getWhereClause = (appid, d1) => {
      //(StartDate <= '${d1}' AND EndDate <= '${d1}') OR (StartDate >= '${d1}')
      return `
      (AppID = '${appid}' OR AppID = 'PROALONOR') AND
      (
        EndDate >= '${d1}'
      )
    `;

    }


    const getECData = async (sf, url, mode = 1) => {
      const batchSize = 1000; // Number of records to fetch per batch
      let skip = 0; // Initial value for skipping records
      let data = [];
      while (true) {
        // Construct the URL with $top and $skip parameters
        // const url = `/EmployeeTime?$filter=approvalStatus ne 'CANCELLED' and userId eq '30862'&$top=${batchSize}&$skip=${skip}`;
        let expand = mode === 1 ? `&$top=${batchSize}&$skip=${skip}&$expand=userNav,companyNav,divisionNav,departmentNav,locationNav,emplStatusNav/picklistLabels` : "$expand=manager";
        url = `${url}` + expand;
        try {
          const responseSF = await sf({
            method: 'GET',
            url: url,
            headers: {
              "content-type": "application/json"
            },
            xsrfHeaderName: "x-csrf-token"
          });

          const SFdata = responseSF.data.d.results;
          data = data.concat(SFdata)
          // Process the data as needed

          // If the number of records fetched is less than the batch size,
          // it means there are no more records to fetch, so exit the loop
          if (SFdata.length < batchSize) {
            break;
          }

          // Increment the skip value for the next batch
          skip += batchSize;

        } catch (error) {
          console.log("Error : " + error);
          break; // Exit the loop in case of an error
        }
      }

      return data;

    }

    try {
      const today = new Date();

      const d = formatDate(today);

      const whereClause = getWhereClause("PROALO", d);
      const Assignments = await SELECT.from(TimeSheetDetails).where(whereClause);
      const approverData = await SELECT.from(LineManagerApproverTable);

      const uniqueEmployeeIDs = [...new Set(Assignments.map(employee => employee.EmployeeID))];
      // const dat = "/User"
      // const res = await getECData(sf, dat, 2);
      for (const EmployeeID of uniqueEmployeeIDs) {
        let ECDATAURL = `/EmpJob?$filter=(userId eq '${EmployeeID}')`;

        let oItem = await getECData(sf, ECDATAURL);
        oItem = oItem[0];
        const employeeTypeMap = {
          "627826": "Rotational",
          "627825": "Regular",
        };

        const extractWSNumbers = function (input) {
          let num1 = '';
          let num2 = '';
          let i = 0;

          // Extract the first number
          while (i < input.length && !isNaN(input[i]) && input[i] !== ' ') {
            num1 += input[i];
            i++;
          }

          // Skip non-numeric characters until the 'x' character is found
          while (i < input.length && input[i].toLowerCase() !== 'x') {
            i++;
          }

          // Move past the 'x' character
          i++;

          // Extract the second number
          while (i < input.length && !isNaN(input[i]) && input[i] !== ' ') {
            num2 += input[i];
            i++;
          }

          if (num1 && num2) {
            if (num1 === 0) return "";
            return (num2 / num1).toFixed(2).toString();
          } else {
            return "";
          }
        }
        let itemX = {
          EmployeeID: oItem?.userId ?? "",
          EmployeeName: oItem?.userNav?.defaultFullName ?? "",
          Division: oItem?.division ?? "",
          DivisionDesc: oItem?.divisionNav?.name ?? "",
          Department: oItem?.department ?? "",
          DepartmentDesc: oItem?.departmentNav?.name ?? "",
          Location: oItem?.location ?? "",
          Country: oItem?.countryOfCompany ?? "",
          OperationalIndicator: oItem?.timeRecordingProfileCode ?? "",
          LocationDesc: oItem?.locationNav?.name ?? "",
          JobTitle: oItem?.jobTitle ?? "",
          CompanyCode: oItem?.company ?? "",
          CompanyCodeDesc: oItem?.companyNav?.name_defaultValue ?? "",
          Workschedule: oItem?.workscheduleCode ?? "",
          Religion: oItem?.Religion ?? "",
          PayGrade: oItem?.payGrade ?? "",
          EmpEmailID: oItem?.userNav?.email ?? "",
          EmployeeIs: employeeTypeMap[oItem?.customString6] ?? "",
          RotationalLeaveBalance: employeeTypeMap[oItem?.customString6] === "Rotational" ? extractWSNumbers(oItem?.workscheduleCode ?? "") ?? "" : ""
        };

        let x = await SELECT.from(TimeSheetDetails).where(`EmployeeID = '${EmployeeID}' AND (
          ((AppID = 'PROALO' OR AppID = 'PROALONOR') AND EndDate >= '${d}')
          OR
          (AppID = 'EMPTIM' AND Date >= '${d}')
      )`);

        const filter = `(userId eq ${EmployeeID})`;
        let base = `/EmployeeTime`;
        let absenceData = await Utilities.getSFData(base, filter, {}, "timeTypeNav");
        absenceData = (absenceData || []).filter(oItem => oItem.timeTypeNav.category === "ABSENCE");
        absenceData = absenceData
          .flatMap(oItem => {
            const dates = Utilities.generateDates(Utilities.convertToDate(oItem?.startDate), Utilities.convertToDate(oItem?.endDate));
            return dates.map(date => ({
              LeaveCode: oItem?.timeType ?? "",
              EmployeeID: oItem?.userId ?? "",
              Date: date ?? "",
              Reason: oItem?.timeTypeNav?.externalName_defaultValue ?? "",
              ApprovalStatus: oItem?.approvalStatus ?? ""
            }));
          });

        for (const item of x) {
          let updateItem = itemX;
          let absenceitem = absenceData.find(obj => item.Date === obj.Date);

          if (absenceitem) {
            if (absenceitem?.ApprovalStatus === "CANCELLED") {
              if (item.Status === "Leave" || item.Status === "Approved" && item.WorkType === "" && item.LeaveCode !== "") {
                updateItem = {
                  ...updateItem,
                  Status: "Open",
                  Absence: "",
                  LeaveCode: "",
                };
              }
            } else {
              if (item.Status === "Open" || item.Status === "Draft") {
                updateItem = {
                  ...updateItem,
                  Absence: absenceitem?.Reason ?? "",
                  LeaveCode: absenceitem?.LeaveCode ?? "",
                  WorkType: "",
                  ItsAllowances: [],
                  Status: "Approved"
                };
              }


            }
          }
          await UPDATE(TimeSheetDetails).set(itemX).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
        }

        // // line manager updation
        let approveritem = approverData.find(obj => obj.EmployeeID === EmployeeID && obj.Levels === "L1");

        if (approveritem) {
          ECDATAURL = `/EmpJob?$filter=(userId eq '${oItem?.managerId ?? ""}')`;
          let approverDetails = await getECData(sf, ECDATAURL);
          approverDetails = approverDetails[0]
          let newapprover = {
            ApproverEmpID: oItem?.managerId ?? "",
            ApproverName: approverDetails?.userNav?.defaultFullName ?? "",
            ApproverEmailID: approverDetails?.userNav?.email ?? "",
            EmployeeName: oItem?.userNav?.defaultFullName ?? "",
            EmployeeEmailID: oItem?.userNav?.email ?? "",
            CompanyCode: oItem?.company ?? "",
          }
          await UPDATE(LineManagerApproverTable).set(newapprover).where({ ID: approveritem.ID });
        }




      };
      return "";
    } catch (error) {
      return error;
    }








  });

  this.on("GET", "ReturnMail", async (req, next) => {

    const query = `SELECT CREATEDBY, 
                    STRING_AGG(EMPLOYEEID, ', ') AS EMPLOYEEIDS
                    FROM (
                        SELECT DISTINCT CREATEDBY, EMPLOYEEID 
                        FROM "TAQA"."TAQA_DB_APPROVERTABLE"
                        WHERE (STATUS = 'Submitted for L2 Approval' OR STATUS = 'Submitted for L1 Approval')
                        AND ADMINID != EMPLOYEEID
                          AND EMPLOYEEID IN (
                              SELECT EMPLOYEEID 
                              FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS"
                              WHERE DELETED = false 
                                AND (
                                      (RETURNINDICATOR = 'R' AND STATUS = 'Open') 
                                      
                                    )
                          )
                    ) AS UniqueEmployees
                    GROUP BY CREATEDBY;`

    const data = await db.run(query);
    try {
      const workflow = await cds.connect.to('TAQA_BPA_CPI');
      console.log("connected to workflow");
      for (let item of data) {
        let emailpayload = {
          "definitionId": "taqaadminreturnnotification.timesheetadminreturnnotification", //"eu10.taqa-dev-fiori.adminmailtrigger.adminReturnNotification",
          "context": {
            "adminmailid": item.CREATEDBY,
            "adminname": "",
            "employeelist": item.EMPLOYEEIDS
          }
        }
        console.table(emailpayload.context);
        var results = await workflow.tx(req).post('/workflow-instances', emailpayload);
      }

    } catch (error) {
      console.log(JSON.stringify(error));
      return error;
      // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
    }





    return data;


  });




  this.on("GET", "ApproveEmailAlerts", async (req, next) => {

    let srv = cds.services['taqa.srv.TaqaDbService'];


    const getReturnQueryData = async function () {
      const query = `SELECT CREATEDBY, 
                    STRING_AGG(EMPLOYEEID, ', ') AS EMPLOYEEIDS
                    FROM (
                        SELECT DISTINCT CREATEDBY, EMPLOYEEID 
                        FROM "TAQA"."TAQA_DB_APPROVERTABLE"
                        WHERE (STATUS = 'Submitted for L2 Approval' OR STATUS = 'Submitted for L1 Approval')
                        AND ADMINID != EMPLOYEEID
                          AND EMPLOYEEID IN (
                              SELECT EMPLOYEEID 
                              FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS"
                              WHERE DELETED = false 
                                AND (
                                      (RETURNINDICATOR = 'R' AND STATUS = 'Open') 
                                      
                                    )
                          )
                    ) AS UniqueEmployees
                    GROUP BY CREATEDBY;`

      const data = await db.run(query);
      try {
        const workflow = await cds.connect.to('TAQA_BPA_CPI');
        console.log("connected to workflow");
        for (let item of data) {
          let emailpayload = {
            "definitionId": "eu10.taqa-dev-fiori.adminmailtrigger.adminReturnNotification",
            "context": {
              "adminmailid": item.CREATEDBY,
              "adminname": "",
              "employeelist": item.EMPLOYEEIDS
            }
          }
          var results = await workflow.tx(req).post('/workflow-instances', emailpayload);
        }

      } catch (error) {
        console.log(JSON.stringify(error));
        return error;
        // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
      }





      return data;
    };



    try {
      const {
        TimeSheetDetails,
        RowInfo,
        ColumnInfo,
        LineManagerApproverTable

      } = cds.entities('taqa.srv.TaqaDbService');

      let cdsEntity = 'taqa.db.TimeSheetDetails';

      const sapAxios = require('sap-cf-axios').default;
      const emailDestination = sapAxios("TAQA_BPA");

      let maintenanceData = await SELECT.from(RowInfo);
      let headers = await SELECT.from(ColumnInfo);
      let LineManagerApproverTableData = await SELECT.from(LineManagerApproverTable);
      console.table(LineManagerApproverTableData);
      let approverTable = maintenanceData.filter(obj => obj.TableName === "Approver Table")
        .map(oItem => ({
          Name: oItem?.Column5 ?? "",
          Email: oItem?.Column4 ?? "",
          ID: oItem?.Column3 ?? "",
          Department: oItem?.Column6 ?? "",
          Level: oItem?.Column12 ?? "",
          ProjectCode: oItem?.Column10 ?? "",
          Division: oItem?.Column17 ?? "",
          CompanyCode: oItem.Column2 ?? "",
        }));

      console.table(approverTable);

      const getTimesheetData = async (TimeSheetDetails, whereClause) => {
        // 
        var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
        return empData;
      };

      const formatDate = (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      };

      let today = new Date();
      const pastDate = new Date();
      pastDate.setMonth(today.getMonth() - 1);
      var sDate = formatDate(pastDate);
      var eDate = formatDate(today);

      whereClause = `Date >= '${sDate}' AND Date <= '${eDate}'`;
      const TimeSheetData = await getTimesheetData(TimeSheetDetails, whereClause);
      // const TimeSheetData = await SELECT.from(TimeSheetDetails)


      let emailpayload = [];

      let LineManagerApproverTableDataIDs = [...new Set(LineManagerApproverTableData.map(approver => approver.ApproverEmpID))];
      console.log("unique ID" + LineManagerApproverTableDataIDs.map(id => `EmployeeID = '${id}'`).join(' OR '));
      LineManagerApproverTableDataIDs.forEach(item => {
        let approver = LineManagerApproverTableData.filter(({ ApproverEmpID }) => ApproverEmpID === item);
        let emailIDs = approver.map(obj => obj.EmployeeID);
        if (approverTable.find(({ ID }) => item === ID)) return;
        let data = TimeSheetData.filter(({ EmployeeID, Status }) => approver.find(obj => obj.EmployeeID === EmployeeID) &&
          Status === `Submitted for ${approver.find(obj => obj.EmployeeID === EmployeeID)?.Levels} Approval`);

        console.table(data);

        if (data.length > 0) {
          emailpayload.push({
            "definitionId": "taqaapproverremindernotification.approverremindernotification",// "eu10.taqa-dev-fiori.approveremainotification.approverNotification",
            "context": {
              "approveremployeeid": item,
              "approvername": approver[0]?.ApproverName,
              "approveremailid": approver[0]?.ApproverEmailID // "pantothomasraja@kaartech.com"
            }
          });
        }


      });
      approverTable.forEach(approver => {
        const baseFilter = ({ Division, CompanyCode, Department, Status, OperationalIndicator, ProjectCode, EmployeeID }) => {
          const isBaseMatch =
            Division === approver.Division &&
            CompanyCode === approver.CompanyCode &&
            Department === approver.Department &&
            OperationalIndicator !== "TRP-1" &&
            Status === `Submitted for ${approver.Level} Approval`;

          const isComplexManager = LineManagerApproverTableData.filter(({ ApproverEmpID }) => ApproverEmpID === approver.ID);
          const isComplexMatch = isComplexManager.length > 0 &&
            isComplexManager.find(obj => obj.EmployeeID === EmployeeID) &&
            OperationalIndicator === "TRP-1" &&
            Status === `Submitted for ${isComplexManager.find(obj => obj.EmployeeID === EmployeeID)?.Levels} Approval`;

          return isBaseMatch || isComplexMatch;
        };

        let data = [];
        if (approver.Level === "CH") {
          data = TimeSheetData.filter(({ CompanyCode, QhseStatus, Status }) =>
            CompanyCode === approver.CompanyCode && QhseStatus === 'Submitted' && Status === "Approved");
        } else if (approver.Level === "L1") {
          data = TimeSheetData.filter(({ Division, CompanyCode, Department, Status, ProjectCode, OperationalIndicator, EmployeeID }) =>
            baseFilter({ Division, CompanyCode, Department, Status, ProjectCode, OperationalIndicator, EmployeeID }) &&
            (!approver.ProjectCode || ProjectCode === approver.ProjectCode));
        } else {
          data = TimeSheetData.filter(baseFilter);
        }

        console.table(data);

        if (data.length > 0) {
          emailpayload.push({
            "definitionId": "taqaapproverremindernotification.approverremindernotification",//"eu10.taqa-dev-fiori.approveremainotification.approverNotification",
            "context": {
              "approveremployeeid": approver.ID,
              "approvername": approver.Name,
              "approveremailid": approver.Email //"pantothomasraja@kaartech.com"
            }
          });
        }
      });

      console.table(emailpayload);
      // emailpayload.forEach(email => {
      //   const response = emailDestination({
      //     method: 'POST',
      //     url: '/http/workflow-instances',
      //     headers: {
      //       "content-type": "application/json"
      //     },
      //     data: JSON.stringify(email),
      //     xsrfHeaderName: "x-csrf-token"
      //   });
      // });

      // try {
      //   for (email of emailpayload) {
      //     console.table(email.context);
      //     const workflow = await cds.connect.to('TAQA_BPA');
      //     var results = await workflow.tx(req).post('/workflow-instances', email);
      //   }
      // } catch (error) {
      //   throw new Error("Trigger failed: Possible authentication issue")
      // }
      // const uniqueEmailPayload = emailpayload.filter((item, index, self) =>
      //   index === self.findIndex((obj) => obj.context.approveremployeeid === item.context.approveremployeeid)
      // );
      const uniqueEmailPayload = emailpayload.filter((item, index, self) => {
        // Ensure that none of the context fields are empty
        const { approveremployeeid, approvername, approveremailid } = item.context;

        const isNotEmpty = approveremployeeid || approvername || approveremailid;

        // Ensure uniqueness based on approveremployeeid
        const isUnique = index === self.findIndex(
          (obj) => obj.context.approveremployeeid === approveremployeeid
        );

        return isNotEmpty && isUnique;
      });
      try {
        const workflow = await cds.connect.to('TAQA_BPA_CPI');
        console.log("connected to workflow");
        for (email of uniqueEmailPayload) {
          console.table(email.context);
          var results = await workflow.tx(req).post('/workflow-instances', email);
        }
      } catch (error) {
        console.log(JSON.stringify(error));
        return error;
        // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
      }

      // getReturnQueryData();


      // const response = emailDestination({
      //   method: 'POST',
      //   url: '/http/workflow-instances',
      //   headers: {
      //     "content-type": "application/json"
      //   },
      //   data: JSON.stringify({
      //     "definitionId": "eu10.taqa-dev-fiori.mailtrigger.aPITRIGGER",
      //     "context": {
      //       "empid": "EmployeeID",
      //       "employeename": "EmployeeName",
      //       "firstdate": "firstDate",
      //       "lastdate": "lastDate",
      //       "status": "status",
      //       "statusflag": true,
      //       "emailid": "data[0].Column4",
      //       "approverName": " data[0].Column5",
      //       "approveremailid": " data[0].Column5",
      //       "costobject": "ProjectDesc"
      //     }
      //   }),
      //   xsrfHeaderName: "x-csrf-token"
      // });


    } catch (error) {
      console.log(error)
    }

  });



  this.on("GET", "ApproveEmailAlertsAMPS", async (req, next) => {

    let srv = cds.services['taqa.srv.TaqaDbService'];


    const getReturnQueryData = async function () {
      const query = `SELECT CREATEDBY, 
                    STRING_AGG(EMPLOYEEID, ', ') AS EMPLOYEEIDS
                    FROM (
                        SELECT DISTINCT CREATEDBY, EMPLOYEEID 
                        FROM "TAQA"."TAQA_DB_APPROVERTABLE"
                        WHERE (STATUS = 'Submitted for L2 Approval' OR STATUS = 'Submitted for L1 Approval')
                        AND ADMINID != EMPLOYEEID
                          AND EMPLOYEEID IN (
                              SELECT EMPLOYEEID 
                              FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS"
                              WHERE DELETED = false 
                                AND (
                                      (RETURNINDICATOR = 'R' AND STATUS = 'Open') 
                                      
                                    )
                          )
                    ) AS UniqueEmployees
                    GROUP BY CREATEDBY;`

      const data = await db.run(query);
      try {
        const workflow = await cds.connect.to('TAQA_BPA_CPI');
        console.log("connected to workflow");
        for (let item of data) {
          let emailpayload = {
            "definitionId": "eu10.taqa-dev-fiori.adminmailtrigger.adminReturnNotification",
            "context": {
              "adminmailid": item.CREATEDBY,
              "adminname": "",
              "employeelist": item.EMPLOYEEIDS
            }
          }
          var results = await workflow.tx(req).post('/workflow-instances', emailpayload);
        }

      } catch (error) {
        console.log(JSON.stringify(error));
        return error;
        // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
      }





      return data;
    };



    try {
      const {
        TimeSheetDetails,
        RowInfo,
        ColumnInfo,
        LineManagerApproverTable

      } = cds.entities('taqa.srv.TaqaDbService');

      let cdsEntity = 'taqa.db.TimeSheetDetails';

      const sapAxios = require('sap-cf-axios').default;
      const emailDestination = sapAxios("TAQA_BPA");

      let maintenanceData = await SELECT.from(RowInfo);
      let headers = await SELECT.from(ColumnInfo);
      let LineManagerApproverTableData = await SELECT.from(LineManagerApproverTable);
      console.table(LineManagerApproverTableData);

      let AMPSCodes = maintenanceData.filter(obj => obj.TabeName === "AMPS").map(oItem => oItem.Column1 ?? "");
      let approverTable = maintenanceData.filter(obj => obj.TableName === "Approver Table" && obj.Column16 === 'X')
        .map(oItem => ({
          Name: oItem?.Column5 ?? "",
          Email: oItem?.Column4 ?? "",
          ID: oItem?.Column3 ?? "",
          Department: oItem?.Column6 ?? "",
          Level: oItem?.Column12 ?? "",
          ProjectCode: oItem?.Column10 ?? "",
          Division: oItem?.Column17 ?? "",
          CompanyCode: oItem.Column2 ?? "",
          AMPS: oItem.Column16 ?? ""
        }));

      console.table(approverTable);

      const getTimesheetData = async (TimeSheetDetails, whereClause) => {
        // 
        var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
        return empData;
      };

      const formatDate = (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      };

      let today = new Date();
      const pastDate = new Date();
      pastDate.setMonth(today.getMonth() - 1);
      var sDate = formatDate(pastDate);
      var eDate = formatDate(today);

      whereClause = `Date >= '${sDate}' AND Date <= '${eDate}'`;
      const TimeSheetData = await getTimesheetData(TimeSheetDetails, whereClause);
      // const TimeSheetData = await SELECT.from(TimeSheetDetails)


      let emailpayload = [];

      let LineManagerApproverTableDataIDs = [...new Set(LineManagerApproverTableData.map(approver => approver.ApproverEmpID))];
      console.log("unique ID" + LineManagerApproverTableDataIDs.map(id => `EmployeeID = '${id}'`).join(' OR '));
      LineManagerApproverTableDataIDs.forEach(item => {
        let approver = LineManagerApproverTableData.filter(({ ApproverEmpID }) => ApproverEmpID === item);
        let emailIDs = approver.map(obj => obj.EmployeeID);
        if (approverTable.find(({ ID }) => item === ID)) return;
        let data = TimeSheetData.filter(({ EmployeeID, Status }) => approver.find(obj => obj.EmployeeID === EmployeeID) &&
          Status === `Submitted for ${approver.find(obj => obj.EmployeeID === EmployeeID)?.Levels} Approval`);

        console.table(data);

        if (data.length > 0) {
          emailpayload.push({
            "definitionId": "taqaapproverremindernotification.approverremindernotification",// "eu10.taqa-dev-fiori.approveremainotification.approverNotification",
            "context": {
              "approveremployeeid": item,
              "approvername": approver[0]?.ApproverName,
              "approveremailid": approver[0]?.ApproverEmailID // "pantothomasraja@kaartech.com"
            }
          });
        }


      });
      approverTable.forEach(approver => {
        const baseFilter = ({ Division, CompanyCode, Department, Status, OperationalIndicator, ProjectCode, EmployeeID }) => {
          const isBaseMatch =
            Division === approver.Division &&
            CompanyCode === approver.CompanyCode &&
            Department === approver.Department &&
            OperationalIndicator !== "TRP-1" &&
            Status === `Submitted for ${approver.Level} Approval`;

          const isComplexManager = LineManagerApproverTableData.filter(({ ApproverEmpID }) => ApproverEmpID === approver.ID);
          const isComplexMatch = isComplexManager.length > 0 &&
            isComplexManager.find(obj => obj.EmployeeID === EmployeeID) &&
            OperationalIndicator === "TRP-1" &&
            Status === `Submitted for ${isComplexManager.find(obj => obj.EmployeeID === EmployeeID)?.Levels} Approval`;

          return isBaseMatch || isComplexMatch;
        };

        let data = [];
        if (approver.Level === "CH") {
          data = TimeSheetData.filter(({ CompanyCode, QhseStatus, Status }) =>
            CompanyCode === approver.CompanyCode && QhseStatus === 'Submitted' && Status === "Approved");
        } else if (approver.Level === "L1") {
          data = TimeSheetData.filter(({ Division, CompanyCode, Department, Status, ProjectCode, OperationalIndicator, EmployeeID }) =>
            baseFilter({ Division, CompanyCode, Department, Status, ProjectCode, OperationalIndicator, EmployeeID }) &&
            (!approver.ProjectCode || ProjectCode === approver.ProjectCode));
        } else {
          data = TimeSheetData.filter(baseFilter);
        }

        console.table(data);

        if (data.length > 0) {
          emailpayload.push({
            "definitionId": "taqaapproverremindernotification.approverremindernotification",//"eu10.taqa-dev-fiori.approveremainotification.approverNotification",
            "context": {
              "approveremployeeid": approver.ID,
              "approvername": approver.Name,
              "approveremailid": approver.Email //"pantothomasraja@kaartech.com"
            }
          });
        }
      });

      console.table(emailpayload);
      // emailpayload.forEach(email => {
      //   const response = emailDestination({
      //     method: 'POST',
      //     url: '/http/workflow-instances',
      //     headers: {
      //       "content-type": "application/json"
      //     },
      //     data: JSON.stringify(email),
      //     xsrfHeaderName: "x-csrf-token"
      //   });
      // });

      // try {
      //   for (email of emailpayload) {
      //     console.table(email.context);
      //     const workflow = await cds.connect.to('TAQA_BPA');
      //     var results = await workflow.tx(req).post('/workflow-instances', email);
      //   }
      // } catch (error) {
      //   throw new Error("Trigger failed: Possible authentication issue")
      // }
      // const uniqueEmailPayload = emailpayload.filter((item, index, self) =>
      //   index === self.findIndex((obj) => obj.context.approveremployeeid === item.context.approveremployeeid)
      // );
      const uniqueEmailPayload = emailpayload.filter((item, index, self) => {
        // Ensure that none of the context fields are empty
        const { approveremployeeid, approvername, approveremailid } = item.context;

        const isNotEmpty = approveremployeeid || approvername || approveremailid;

        // Ensure uniqueness based on approveremployeeid
        const isUnique = index === self.findIndex(
          (obj) => obj.context.approveremployeeid === approveremployeeid
        );

        return isNotEmpty && isUnique;
      });
      try {
        const workflow = await cds.connect.to('TAQA_BPA_CPI');
        console.log("connected to workflow");
        for (email of uniqueEmailPayload) {
          console.table(email.context);
          var results = await workflow.tx(req).post('/workflow-instances', email);
        }
      } catch (error) {
        console.log(JSON.stringify(error));
        return error;
        // return new Error("Email failed to send due to Authorisation issue" + JSON.stringify(error));
      }

      // getReturnQueryData();


      // const response = emailDestination({
      //   method: 'POST',
      //   url: '/http/workflow-instances',
      //   headers: {
      //     "content-type": "application/json"
      //   },
      //   data: JSON.stringify({
      //     "definitionId": "eu10.taqa-dev-fiori.mailtrigger.aPITRIGGER",
      //     "context": {
      //       "empid": "EmployeeID",
      //       "employeename": "EmployeeName",
      //       "firstdate": "firstDate",
      //       "lastdate": "lastDate",
      //       "status": "status",
      //       "statusflag": true,
      //       "emailid": "data[0].Column4",
      //       "approverName": " data[0].Column5",
      //       "approveremailid": " data[0].Column5",
      //       "costobject": "ProjectDesc"
      //     }
      //   }),
      //   xsrfHeaderName: "x-csrf-token"
      // });


    } catch (error) {
      console.log(error)
    }

  });

  // main
  // this.on("GET", "AbsenceRecordsFunc", async (req, next) => {

  //   const generateEmployeeIDfilter = (employees, key) => {
  //     if (employees.length > 0) {
  //       const Filter = employees.map(id => `${key} eq '${id}'`).join(' or ');
  //       return "(" + Filter + ")";
  //     } else return "";
  //   };
  //   const processMaintenanceData = (maintenanceData) => {
  //     const TableMaintenanceHelper = {
  //       getOverTimeException: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "Overtime Exception")
  //           .map(oItem => ({
  //             WorkTypeCode: oItem?.Column1 ?? "",
  //             Hours: oItem?.Column2 ?? ""
  //           }));
  //       },
  //       getUAsettings: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "UA settings")
  //           .map(oItem => oItem?.Column1 ?? "");
  //       },
  //       getOverTimeValidity: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "Overtime Eligibility")
  //           .map(oItem => ({
  //             PayGrade: oItem?.Column2
  //           }));
  //       },
  //       getAMPSOvertimeDetails: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "Overtime Location Formula")
  //           .map(oItem => ({
  //             Location: oItem?.Column2,
  //             Normal: oItem?.Column3,
  //             WeekOff: oItem?.Column4,
  //             Holiday: oItem?.Column5,
  //             Night: oItem?.Column6,
  //             NightHours: oItem?.Column7

  //           }));
  //       },
  //       getAllowancevalidity: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "Allowances")
  //           .map(oItem => ({
  //             HanaID: oItem?.Column1 ?? "",
  //             AllowanceDesc: oItem?.Column2 ?? "",
  //             Amount: oItem?.Column3 ?? "",
  //             CompanyCode: oItem?.Column4 ?? "",
  //             Department: oItem?.Column6 ?? "",
  //             Location: oItem.Column10 ?? "",


  //             Import: oItem?.Column8 ?? "",
  //             AllowanceID: oItem.Column9 ?? "",
  //           }));


  //       },
  //       getAMPSCodes: tableData => {
  //         return tableData
  //           .filter(object => object?.TableName === "AMPS")
  //           .map(oItem => oItem?.Column1 ?? "");
  //       },


  //     };

  //     const OvertimeEligibility = TableMaintenanceHelper.getOverTimeValidity(maintenanceData);
  //     const AllowanceEligibility = TableMaintenanceHelper.getAllowancevalidity(maintenanceData);
  //     const AMPSCodes = TableMaintenanceHelper.getAMPSCodes(maintenanceData);
  //     const OvertimeException = TableMaintenanceHelper.getOverTimeException(maintenanceData);
  //     const AMPSOvertime = TableMaintenanceHelper.getAMPSOvertimeDetails(maintenanceData);

  //     const UASettings = TableMaintenanceHelper.getUAsettings(maintenanceData)

  //     return {
  //       OvertimeEligibility,
  //       AllowanceEligibility,
  //       AMPSCodes,
  //       OvertimeException,
  //       AMPSOvertime,
  //       UASettings

  //     }



  //   };


  //   const getLeaveData = async (sf, url) => {
  //     const batchSize = 1000; // Number of records to fetch per batch
  //     let skip = 0; // Initial value for skipping records
  //     let data = [];
  //     while (true) {
  //       // Construct the URL with $top and $skip parameters
  //       // const url = `/EmployeeTime?$filter=approvalStatus ne 'CANCELLED' and userId eq '30862'&$top=${batchSize}&$skip=${skip}`;
  //       url = `${url}$top=${batchSize}&$skip=${skip}` + '&$expand=countryNav,holidayAssignments,holidayAssignments/holidayNav'
  //       try {
  //         const responseSF = await sf({
  //           method: 'GET',
  //           url: url,
  //           headers: {
  //             "content-type": "application/json"
  //           },
  //           xsrfHeaderName: "x-csrf-token"
  //         });

  //         const SFdata = responseSF.data.d.results;
  //         data = data.concat(SFdata)
  //         // Process the data as needed

  //         // If the number of records fetched is less than the batch size,
  //         // it means there are no more records to fetch, so exit the loop
  //         if (SFdata.length < batchSize) {
  //           break;
  //         }

  //         // Increment the skip value for the next batch
  //         skip += batchSize;

  //       } catch (error) {
  //         console.log("Error : " + error);
  //         break; // Exit the loop in case of an error
  //       }
  //     }

  //     return data;

  //   }
  //   const getSFdata = async (sf, url, op) => {
  //     const batchSize = 1000; // Number of records to fetch per batch
  //     let skip = 0; // Initial value for skipping records
  //     let data = [];
  //     while (true) {
  //       // Construct the URL with $top and $skip parameters
  //       // const url = `/EmployeeTime?$filter=approvalStatus ne 'CANCELLED' and userId eq '30862'&$top=${batchSize}&$skip=${skip}`;
  //       url = `${url}&$top=${batchSize}&$skip=${skip}` + ((op ?? 1) === 2 ? `&$expand=workScheduleDays` : ``) + ((op ?? 1) === 5 ? `&$expand=timeTypeNav` : ``);
  //       try {
  //         const responseSF = await sf({
  //           method: 'GET',
  //           url: url,
  //           headers: {
  //             "content-type": "application/json"
  //           },
  //           xsrfHeaderName: "x-csrf-token"
  //         });

  //         const SFdata = responseSF.data.d.results;
  //         data = data.concat(SFdata)
  //         // Process the data as needed

  //         // If the number of records fetched is less than the batch size,
  //         // it means there are no more records to fetch, so exit the loop
  //         if (SFdata.length < batchSize) {
  //           break;
  //         }

  //         // Increment the skip value for the next batch
  //         skip += batchSize;

  //       } catch (error) {
  //         console.log("Error : " + error);
  //         break; // Exit the loop in case of an error
  //       }
  //     }

  //     return data;

  //   }

  //   const getWhereClause = (appid, d1, d2) => {
  //     return `
  //     (AppID = '${appid}' OR AppID = 'PROALONOR') AND
  //     (
  //       (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
  //       (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
  //       (StartDate <= '${d1}' AND EndDate >= '${d2}')
  //     )
  //   `;

  //   }

  //   const getTimesheetData = async (TimeSheetDetails, whereClause) => {
  //     // 
  //     var empData = await SELECT.from(TimeSheetDetails).where(whereClause);
  //     return empData;
  //   }
  //   const formatDate = (date, format = 1) => {

  //     const day = date.getDate().toString().padStart(2, '0');
  //     const month = (date.getMonth() + 1).toString().padStart(2, '0');
  //     const year = date.getFullYear().toString();

  //     if (format === 1) return `${year}-${month}-${day}`;
  //     else if (format === 2) return `${day}-${month}-${year}`;
  //     else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
  //     else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
  //   };
  //   const convertToDate = (dateString) => {
  //     const timestamp = parseInt(dateString.match(/\/Date\((\d+)\)\//)[1], 10);
  //     return new Date(timestamp);
  //   };

  //   const isUnAuthorised = (Assignment, TimeSheetData, absenceData, holidayData, currentDate, ID) => {
  //     const formattedDate = formatDate(currentDate);

  //     const isValidAssignment = Assignment.some(obj => obj.StartDate <= formattedDate && obj.EndDate >= formattedDate);

  //     const isTimesheetMissing = isValidAssignment &&
  //       !TimeSheetData.some(obj => obj.EmployeeID === ID && obj.Date === formattedDate && obj.Status !== "Open" && obj.Status !== "Draft");

  //     const isAbsence = absenceData.some(obj => obj.userId === ID && convertToDate(obj.startDate) <= currentDate && convertToDate(obj.endDate) >= currentDate && obj.timeTypeNav.category === "ABSENCE");

  //     const isHoliday = holidayData.some(obj => obj.Date === formattedDate);

  //     return isTimesheetMissing && !isAbsence && !isHoliday;
  //   };

  //   const isWeekoffUnAuthorised = (Assignment, workingHoursData, TimeSheetData, absenceData, holidayData, currentDate, ID) => {

  //     const getPreviousOrNextWorkingDay = (date, workingHours, direction) => {
  //       let tempDate = new Date(date);
  //       let daysOffset = direction === 'previous' ? -1 : 1;
  //       let workingHoursForDay;
  //       do {
  //         tempDate.setDate(tempDate.getDate() + daysOffset);
  //         workingHoursForDay = workingHours[((tempDate.getDay() + 6) % 7)];

  //         // If there is no '0' in the workingHoursData, assume all days are working
  //         if (workingHours.every(day => day !== '0') || workingHoursForDay !== '0') {
  //           return tempDate;
  //         }
  //       } while (workingHoursForDay === '0');

  //       return tempDate;
  //     };

  //     const yesterdayDate = getPreviousOrNextWorkingDay(currentDate, workingHoursData, 'previous');
  //     const tomorrowDate = getPreviousOrNextWorkingDay(currentDate, workingHoursData, 'next');

  //     const beforeUnauthorized = isUnAuthorised(Assignment, TimeSheetData, absenceData, holidayData, yesterdayDate, ID);
  //     const afterUnauthorized = isUnAuthorised(Assignment, TimeSheetData, absenceData, holidayData, tomorrowDate, ID);

  //     return beforeUnauthorized && afterUnauthorized;
  //   };

  //   function isGreaterOrEqual(inputString, referenceString = "PG13") {
  //     // Normalize the input and reference strings
  //     const normalizedInput = inputString.toUpperCase();
  //     const normalizedReference = referenceString.toUpperCase();

  //     // Check if the input is "NA" or "N/A"
  //     if (normalizedInput === "NA") {
  //       return true; // Ignore NA; consider it greater or do whatever logic you want
  //     }

  //     // Extract the alphabetical and numeric parts
  //     const [inputPrefix, inputNumber] = extractParts(normalizedInput);
  //     const [referencePrefix, referenceNumber] = extractParts(normalizedReference);

  //     // Compare the prefixes
  //     if (inputPrefix > referencePrefix) {
  //       return true; // input is greater
  //     } else if (inputPrefix < referencePrefix) {
  //       return false; // input is lesser
  //     } else {
  //       // If prefixes are equal, compare numeric parts
  //       return parseInt(inputNumber, 10) >= parseInt(referenceNumber, 10);
  //     }
  //   }

  //   // Helper function to extract the prefix and numeric part
  //   function extractParts(str) {
  //     const match = str.match(/^([A-Za-z]+)(\d+)$/);
  //     return match ? [match[1], match[2]] : [str, "0"]; // Return the parts or default if not matched
  //   }
  //   let srv = cds.services['taqa.srv.TaqaDbService'];
  //   try {
  //     const {
  //       TimeSheetDetails,
  //       RowInfo
  //     } = cds.entities('taqa.srv.TaqaDbService');

  //     let cdsEntity = 'taqa.db.TimeSheetDetails';

  //     const sapAxios = require('sap-cf-axios').default;
  //     const sf = sapAxios("SF");

  //     const today = new Date();

  //     // Calculate the date two months before today
  //     const pastDate = new Date();
  //     pastDate.setMonth(today.getMonth() - 4);
  //     var sDate = formatDate(pastDate);
  //     var eDate = formatDate(today);

  //     let ECpayload = [];
  //     let pushData = [];
  //     let putData = [];


  //     // let AmpsCodesQuery = SELECTRowInfo
  //     const maintenanceRawData = await SELECT.from(RowInfo);

  //     const maintenanceData = processMaintenanceData(maintenanceRawData)

  //     const { AMPSCodes, UASettings } = maintenanceData;

  //     let whereClause = getWhereClause("PROALO", sDate, eDate);
  //     const Assignments = await getTimesheetData(TimeSheetDetails, whereClause);
  //     if (Assignments.length > 0) {
  //       let uniqueEmployeeIDs = [...new Set(Assignments.map(employee => employee.EmployeeID))];
  //       let IdsList = uniqueEmployeeIDs.map(employeeID => {
  //         // Find the first assignment with the current employeeID to get the EmpUserEmail
  //         const employeeAssignment = Assignments.find(assignment => assignment.EmployeeID === employeeID);

  //         return {
  //           EmployeeID: employeeID,
  //           EmpUserEmail: employeeAssignment.EmpUserEmail
  //         };
  //       });
  //       const workSchedules = [...new Set(Assignments.map(employee => employee.Workschedule))];

  //       const countries = [...new Set(Assignments.map(employee => employee.Country))];


  //       whereClause = `Date >= '${sDate}' AND Date <= '${eDate}'`;
  //       const TimeSheetData = await getTimesheetData(TimeSheetDetails, whereClause);
  //       // call to s4 start

  //       urlFull = "/WorkSchedule?filter=" + generateEmployeeIDfilter(workSchedules, "externalCode") + "";
  //       var workingHoursData = await getSFdata(sf, urlFull, 2);

  //       urlFull = "/HolidayCalendar?"
  //       let HolidayData = await getLeaveData(sf, urlFull);
  //       let currentDate = "";
  //       const endDate = new Date(eDate);


  //       const generatePayload = (Date, Assignments, TimeSheetData, pushData, putData, weekoff, workedHours, absence, reason) => {
  //         let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  //         let count = 0;
  //         Assignments.forEach(Assignment => {

  //           let payload = {
  //             "DELETED": false,
  //             //"ID": Assignment.ID,
  //             "Attachment": "",
  //             "AppID": "EMPTIM",
  //             "Date": formatDate(Date),
  //             "EmployeeID": Assignment.EmployeeID ?? "",
  //             "EmployeeName": Assignment.EmployeeName ?? "",
  //             "EmployeeIs": Assignment.EmployeeIs ?? "",
  //             "Division": Assignment.Division ?? "",
  //             "DivisionDesc": Assignment.DivisionDesc ?? "",
  //             "Department": Assignment.Department ?? "",
  //             "DepartmentDesc": Assignment.DepartmentDesc ?? "",
  //             "Country": Assignment.Country ?? "",
  //             "OperationalIndicator": Assignment.OperationalIndicator ?? "",
  //             "StartDate": Assignment.StartDate,
  //             "EndDate": Assignment.EndDate,
  //             "Location": ((Assignment.Location) ?? ""),
  //             "LocationDesc": (Assignment.LocationDesc) ?? "",
  //             "CostCenter": Assignment.CostCenter ?? "",
  //             "CostCenterDesc": Assignment.CostCenterDesc ?? "",
  //             "InternalOrder": Assignment.InternalOrder ?? "",
  //             "InternalOrderDesc": Assignment.InternalOrderDesc ?? "",
  //             "WbsCode": Assignment.WbsCode ?? "",
  //             "WbsCodeDesc": Assignment.WbsCodeDesc ?? "",
  //             "JobTitle": Assignment.JobTitle ?? "",
  //             "JobCode": Assignment.JobCode ?? "",
  //             "LeaveCode": absence ? reason?.timeType ?? "" : "",

  //             "ExternalCode": Assignment.ExternalCode,

  //             "Day": days[Date.getDay()],
  //             "WorkType": weekoff || absence ? "" : "Absent",
  //             "CompanyCode": Assignment.CompanyCode ?? "",
  //             "CompanyCodeDesc": Assignment.CompanyCodeDesc ?? "",
  //             "Workschedule": Assignment.Workschedule,
  //             // api
  //             "ItsAllowances": count < 1 && !weekoff && !absence ? [{
  //               EmployeeID: Assignment.EmployeeID,
  //               WbsCode: Assignment.WbsCode ?? "",
  //               InternalOrder: Assignment.InternalOrder ?? "",
  //               CostCenter: Assignment.CostCenter ?? "",
  //               Reversed: "",
  //               Date: formatDate(Date),
  //               AllowanceID: "3007",
  //               AllowanceDesc: "UnAuthorised Absence",
  //               Status: "Replicated",
  //               HistoryRecord: "",
  //               // Amount: (otamount.toFixed(1)).toString(),
  //               // Number: rowData["OvertimeHours"],
  //               Reversed: "",
  //               ReferenceKey: Assignment.EmployeeID + formatDate(Date, 3) + "3007"
  //             }] : [],
  //             "RegularHours": workedHours,
  //             // calculate
  //             "WorkedHours": workedHours,
  //             "TotalHours": "0",
  //             "ProjectDesc": Assignment.ProjectDesc,
  //             // null because this is already being taken care of.
  //             "Absence": weekoff ? "Week-Off" : absence ? reason?.timeTypeNav?.externalName_defaultValue : "Un-Authorised Absence",
  //             "Status": "Approved",
  //             "Comment": "",
  //             "Religion": Assignment.Religion ?? "",
  //             // what does this do
  //             "PayGrade": Assignment.PayGrade ?? "",
  //             // what does this do
  //             // "DynamicRole": employeeDetails.DynamicRole ?? "",
  //           };

  //           let data = TimeSheetData.find(obj => obj.EmployeeID === Assignment.EmployeeID
  //             && obj.Date === formatDate(Date)
  //             && obj.WbsCode === Assignment.WbsCode
  //             && obj.InternalOrder === Assignment.InternalOrder
  //             && obj.CostCenter === Assignment.CostCenter
  //           )

  //           let isValid = Assignment.StartDate <= formatDate(Date) && Assignment.EndDate >= formatDate(Date);
  //           if (isValid) count += 1;
  //           if (data === undefined) {
  //             if (isValid) {
  //               pushData.push(payload)
  //             }

  //           } else {
  //             // console.log(data);
  //             if (data.ItsAllowances?.length > 0 && (data.ItsAllowances).find(obj => obj.Status === "Replicated") !== undefined);
  //             else
  //               if (isValid === true)
  //                 putData.push({ ...payload, ID: data.ID });
  //           }


  //         });

  //         return [pushData, putData]
  //       }
  //       console.log("EmployeeIDs having projects", uniqueEmployeeIDs);
  //       // uniqueEmployeeIDs = ["27448"]
  //       let i = 1;
  //       for (let ID of uniqueEmployeeIDs) {
  //         console.log(`${i} of ${uniqueEmployeeIDs.length} Employees`)
  //         console.log("---------------- START Processing for Employee ", ID);
  //         currentDate = new Date(sDate);
  //         const idInfo = IdsList.find(obj => obj.EmployeeID === ID);
  //         // --------------- DATA PREP -----------------------
  //         const filter = `approvalStatus ne 'CANCELLED' and (${[ID, idInfo?.EmpUserEmail].map(id => `userId eq '${id}'`).join(' or ')})`;
  //         let urlFull = `/EmployeeTime?$filter=${filter}`;
  //         var absenceData = await getSFdata(sf, urlFull, 5);


  //         const Assignment = Assignments.filter(obj => obj.EmployeeID === ID);


  //         if (Assignment.find(obj => obj.CompanyCode === "1000" || obj.Workschedule === "5D8HSUNTHU" || isGreaterOrEqual(obj.PayGrade))) {
  //           // console.log("Ignored", ID);
  //           continue
  //         }


  //         var dailydata = [];

  //         // ---------- holiday -------------

  //         //   return (Holidays || []).flatMap(oItem => {
  //         //     const Country = oItem?.country || "";
  //         //     return (oItem?.holidayAssignments?.results || []).map(Holiday => ({
  //         //         Country,
  //         //         Name: Holiday?.holidayNav?.name_defaultValue || "",
  //         //         Date: HelperModule.DateHelpers.formatDate(new Date(Holiday?.date || null))
  //         //     }));
  //         // });
  //         let holidays = HolidayData.filter(oItem => oItem.country === Assignment[0]?.Country);
  //         holidays = holidays.flatMap(oItem => {
  //           const Country = oItem?.country || "";
  //           return (oItem?.holidayAssignments?.results || []).map(Holiday => ({
  //             Country,
  //             Name: Holiday?.holidayNav?.name_defaultValue || "",
  //             Date: formatDate(convertToDate(Holiday?.date) || null)
  //           }));
  //         });
  //         // holidays = (holidays?.holidayAssignments?.results || []).map(Holiday => ({
  //         //   Name: Holiday?.holidayNav?.name_defaultValue || "",
  //         //   Date: formatDate(new Date(Holiday?.date || null))
  //         // }));

  //         // -----------------------------------



  //         // ----------------------------------
  //         while (currentDate <= endDate) {
  //           console.log(`----- START Processing for employee ${ID} , DATE - ${currentDate} --------`);
  //           // checking if the employee is assigned under a project on this date
  //           const X = formatDate(currentDate);
  //           const isValidDate = Assignment.filter(obj => obj.StartDate <= formatDate(currentDate) && obj.EndDate >= formatDate(currentDate))
  //           if (isValidDate.find(obj => !UASettings.includes(obj.CompanyCode))) {
  //             currentDate.setDate(currentDate.getDate() + 1);
  //             console.log(`----- END Processing for employee ${ID} , DATE - ${currentDate} --------`);
  //             continue;
  //           }
  //           if (isValidDate.length !== 0 && TimeSheetData.find(obj => obj.EmployeeID === ID && obj.Date === formatDate(currentDate) && obj.Status !== "Open" && obj.Status !== "Draft" && obj.ReturnIndicator !== "X" && obj.ReturnIndicator !== "R") === undefined) {

  //             var wrkdy = workingHoursData.find(obj => obj.externalCode === isValidDate[0].Workschedule);
  //             if (wrkdy !== undefined) {
  //               wrkdy.workScheduleDays.results.forEach(obj => {
  //                 dailydata.push(obj.workingHours)
  //               });

  //               var dtr = absenceData.find(obj => obj.userId === ID && convertToDate(obj.startDate) <= currentDate && convertToDate(obj.endDate) >= currentDate && obj.timeTypeNav.category === "ABSENCE")
  //               // if no leave on that day
  //               let itemHoldiday = holidays.find(obj => obj.Date === X);
  //               if (dtr === undefined) {
  //                 // console.log(dailydata[((currentDate.getDay() + 6) % 7)]);
  //                 // if not weekend
  //                 const week = dailydata[((currentDate.getDay() + 6) % 7)];
  //                 let considerWeekoff = isWeekoffUnAuthorised(Assignment, dailydata, TimeSheetData, absenceData, holidays, currentDate, ID);

  //                 if (dailydata[((currentDate.getDay() + 6) % 7)] !== '0' || (week === '0' && considerWeekoff)) { //dailydata[((currentDate.getDay() + 6) % 7)] !== '0'
  //                   if (!itemHoldiday) {

  //                     [pushData, putData] = generatePayload(currentDate, Assignment, TimeSheetData, pushData, putData, false, dailydata[((currentDate.getDay() + 6) % 7)], false, "")
  //                     let data = TimeSheetData.find(obj => obj.EmployeeID === Assignment.EmployeeID
  //                       && obj.Date === formatDate(currentDate)
  //                       && obj.WbsCode === Assignment[0].WbsCode
  //                       && obj.InternalOrder === Assignment[0].InternalOrder
  //                       && obj.CostCenter === Assignment[0].CostCenter
  //                     )

  //                     if (data !== undefined) {
  //                       if (data.ItsAllowances.find(obj => obj.AllowanceID === '3007') !== undefined);
  //                       else {
  //                         ECpayload.push({
  //                           REVERSED: "",
  //                           EMPLOYEENUMBER: Assignment[0].EmployeeID ?? "",
  //                           VALIDITYDATE: formatDate(currentDate) ?? "",
  //                           WAGETYPE: "3007",
  //                           NUMBER: "1",
  //                           Time_Measurement_Unit: "",
  //                           AMOUNT: "",
  //                           Referencekey: Assignment[0].EmployeeID ?? "" + formatDate(currentDate, 3) ?? "" + "3007",
  //                           CostCenter: Assignment[0].CostCenter ?? "",
  //                           WBS: Assignment[0].WbsCode ?? "",
  //                           InternalOrder: Assignment[0].InternalOrder ?? "",
  //                           NetworkNumber: "",
  //                           ActivityNumber: "",
  //                           LogicalSystemSource: "BTP",
  //                           Reference_Transc: "EXT"
  //                         });
  //                       }
  //                     } else {
  //                       ECpayload.push({
  //                         REVERSED: "",
  //                         EMPLOYEENUMBER: Assignment[0].EmployeeID ?? "",
  //                         VALIDITYDATE: formatDate(currentDate) ?? "",
  //                         WAGETYPE: "3007",
  //                         NUMBER: "1",
  //                         Time_Measurement_Unit: "",
  //                         AMOUNT: "",
  //                         Referencekey: (Assignment[0].EmployeeID ?? "") + (formatDate(currentDate, 3) ?? "") + "3007",
  //                         CostCenter: Assignment[0].CostCenter ?? "",
  //                         WBS: Assignment[0].WbsCode ?? "",
  //                         InternalOrder: Assignment[0].InternalOrder ?? "",
  //                         NetworkNumber: "",
  //                         ActivityNumber: "",
  //                         LogicalSystemSource: "BTP",
  //                         Reference_Transc: "EXT"
  //                       });
  //                     }
  //                     // payload = [...payload, ...generatePayload(currentDate, Assignment)];
  //                   }
  //                   else {
  //                     [pushData, putData] = generatePayload(currentDate, Assignment, TimeSheetData, pushData, putData, false, dailydata[((currentDate.getDay() + 6) % 7)], true, { timeTypeNav: { externalName_defaultValue: itemHoldiday.Name } }); // reason?.timeTypeNav?.externalName_defaultValue
  //                   }


  //                 } else {
  //                   [pushData, putData] = generatePayload(currentDate, Assignment, TimeSheetData, pushData, putData, true, dailydata[((currentDate.getDay() + 6) % 7)], false, "");
  //                 }


  //               } else {
  //                 [pushData, putData] = generatePayload(currentDate, Assignment, TimeSheetData, pushData, putData, false, dailydata[((currentDate.getDay() + 6) % 7)], true, dtr);
  //               }
  //             }

  //           };

  //           currentDate.setDate(currentDate.getDate() + 1);
  //           console.log(`----- END Processing for employee ${ID} , DATE - ${currentDate} --------`);
  //         }


  //         i += 1;
  //         console.log(`----- END Processing for employee ${ID}`);

  //       }
  //       console.table(pushData);
  //       console.table(putData);
  //       console.table(ECpayload)
  //       // console.log(pushData, putData, ECpayload);

  //       // Create code : Anto : Start
  //       try {
  //         if (Array.isArray(pushData)) {
  //           if (pushData.length > 0) {
  //             const results = await srv.create(TimeSheetDetails).entries(pushData);
  //             // return results;
  //             //    console.log(results);
  //           }

  //         }
  //       } catch (err) {
  //         console.error(err);
  //         req.error(500, 'Error while creating record(s)');
  //       }
  //       // Create code : Anto : End

  //       // Update code : Anto : Anto
  //       try {
  //         const results = [];
  //         for (const item of putData) {
  //           const id = item.ID;
  //           const result = await srv.update(TimeSheetDetails).set(item).where({ ID: item.ID, EmployeeID: item.EmployeeID, AppID: item.AppID, Date: item.Date, WbsCode: item.WbsCode, InternalOrder: item.InternalOrder, CostCenter: item.CostCenter });
  //           results.push(result);
  //         }
  //         // return results;
  //         //   console.log(results);
  //       } catch (err) {
  //         console.error(err);
  //         req.error(500, 'Error while updating record(s)');
  //       }
  //       // Update code : Anto : End

  //     }

  //     return ECpayload;

  //   } catch (error) {
  //     console.log(error)
  //   }
  // });



  // travel mass upload update
  this.on("GET", "TravelMasterDataUpdate", async (req, next) => {




    const Utilities = {
      convertToDateString: (dateString, mode = 1) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Check if the Date object is valid
          // if (isNaN(date)) {
          //   throw new Error("Invalid timestamp");
          // }

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');

          if (mode === 1) {
            return `${year}-${month}-${day}`;
          }
          // ISO 8601 format: yyyy-mm-ddThh:mm:ss
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;


        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      constructURL: (baseURL, filter, parameters, expand = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty or undefined
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided and not empty
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            // Ensure both key and value are URL encoded
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}` : baseURL;

        return fullURL;
      },

      getEmpName: function (value) {

        if (value !== "" && value !== undefined) {

          let str = value;

          let result = str.replace(/null/g, ''); // Removes all occurrences of "null"

          result = result.trim();

          // console.log(result.trim());

          return result;

        }

        else {

          return value;

        }

      },


      getSFData: async (baseURL, filter, parameters, expand) => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand);
        const batchSize = 1000; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}&fromDate=1900-01-01&toDate=9999-12-31&$top=${batchSize}&$skip=${skip}`;
          console.log("URL INFO", url, paginatedUrl);
          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            data = data.concat(SFdata);

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error WITH API: " + error);
            console.log("Error : " + error);
            break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
    };

    const TravelUtilities = {
      processRecords: (data) => {

        return (data || []).flatMap((child) => {

          let familyDetails = []
          if (child?.cust_travelWithFamily !== 'N') {
            familyDetails = [
              {
                ExternalCode: child?.cust_dependentdetails1 || "",
                FirstName: child?.cust_firstNameOfDependent1 || "",
                MiddleName: child?.cust_middleNameOfDependent1 || "",
                LastName: child?.cust_lastNameOfDependent1 || "",
                Title: child?.cust_titleOfDependent1 || "",
                Relationship: child?.cust_relationshipOfDependent1 || "",
                DateOfBirth: Utilities.convertToDateString(child?.cust_dobOfDependent1 || ""),
              },
              {
                ExternalCode: child?.cust_dependentdetails2 || "",
                FirstName: child?.cust_firstNameOfDependent2 || "",
                MiddleName: child?.cust_middleNameOfDependent2 || "",
                LastName: child?.cust_lastNameOfDependent2 || "",
                Title: child?.cust_titleOfDependent2 || "",
                Relationship: child?.cust_relationshipOfDependent2 || "",
                DateOfBirth: Utilities.convertToDateString(child?.cust_dobOfDependent2 || ""),
              },
              {
                ExternalCode: child?.cust_dependentdetails3 || "",
                FirstName: child?.cust_firstNameOfDependent3 || "",
                MiddleName: child?.cust_middleNameOfDependent3 || "",
                LastName: child?.cust_lastNameOfDependent3 || "",
                Title: child?.cust_titleOfDependent3 || "",
                Relationship: child?.cust_relationshipOfDependent3 || "",
                DateOfBirth: Utilities.convertToDateString(child?.cust_dobOfDependent3 || ""),
              },
              {
                ExternalCode: child?.cust_dependentdetails4 || "",
                FirstName: child?.cust_firstNameOfDependent4 || "",
                MiddleName: child?.cust_middleNameOfDependent4 || "",
                LastName: child?.cust_lastNameOfDependent4 || "",
                Title: child?.cust_titleOfDependent4 || "",
                Relationship: child?.cust_relationshipOfDependent4 || "",
                DateOfBirth: Utilities.convertToDateString(child?.cust_dobOfDependent4 || ""),
              }
            ];

            // Filter out dependents where all fields are null/empty
            familyDetails = familyDetails.filter(family =>
              family.FirstName || family.MiddleName || family.LastName || family.Title || family.Relationship || family.DateOfBirth || family.ExternalCode
            );
          }

          return {
            ParentExternalCode: child?.externalCode || "",
            TransactionSequence: child?.mdfSystemTransactionSequence || "",
            EffectiveStartDate: Utilities.convertToDateString(child?.mdfSystemEffectiveStartDate || ""),

            EmployeeID: child?.cust_empeid || "",
            EmployeeName: Utilities.getEmpName(child?.cust_empname || ""),
            Designation: child?.cust_desig || "",
            Department: child?.cust_department || "",
            CostCentre: child?.cust_costcen || "",
            Nationality: child?.cust_nationality || "",
            Age: child?.cust_age || "",


            HomeCountry: child?.cust_homecountry || "",
            LegalEntity: child?.cust_compcode || "",
            CompanyCode: child?.cust_compcode || "",
            JobTitle: child?.cust_desig || "",
            Function: child?.cust_func || "",
            Division: child?.cust_div || "",

            LeaveSchedule: child?.cust_leavecycle || "",

            FileID: child?.cust_attachmentNav?.attachmentId || "",
            DocName: child?.cust_attachmentNav?.fileName || "",
            // MimeType: child?.cust_attachmentNav?.mimeType || "",
            // FileContent: Buffer.from((child?.cust_attachmentNav?.fileContent || ""), 'base64'),


            JobStartDate: Utilities.convertToDateString(child?.cust_jobStartDate || ""),
            JobEndDate: Utilities.convertToDateString(child?.cust_jobEndDate || ""),

            TravelCategoryTQ: child?.cust_travelcategorytq || "",
            TravelCategory: child?.cust_travelcategory || "",
            TravelType: child?.cust_TravelType || "",
            PurposeofTravel: child?.cust_purposeoftravel || "",
            VisaRequirement: child?.cust_VisaRequirement || "",
            Transportation: child?.cust_Transportation || "",
            Hotel: child?.cust_Hotel || "",
            MobileNo: child?.cust_localMobileNo || "",
            TypeofTravel: child?.cust_typeoftravel || "",
            DepartureDate: Utilities.convertToDateString(child?.cust_DepartureDate || ""),
            DepartureSector: child?.cust_departureCountry || "",
            DepartureTime: child?.cust_departtime || "",
            ReturnDate: Utilities.convertToDateString(child?.cust_ArrivalDate || ""),
            ReturnSector: child?.cust_des_country || "",
            ReturnTime: child?.cust_returntime || "",
            AirportCity: child?.cust_airportCityDest || "",

            Exit: child?.cust_exitreentry || "",
            ExitDuration: child?.cust_duration || "",
            BusinessStartDate: Utilities.convertToDateString(child?.cust_businessstartdate || ""),
            BusinessEndDate: Utilities.convertToDateString(child?.cust_businessenddate || ""),
            TrainingStartDate: Utilities.convertToDateString(child?.cust_businessstartdate || ""),
            TrainingEndDate: Utilities.convertToDateString(child?.cust_businessenddate || ""),
            CreationDate: Utilities.convertToDateString((child?.createdDateTime || ""), 2),

            Region: child?.cust_Destination || "",
            ChildExternalCode: child?.externalCode || "",

            DestinationCountry: child?.cust_des_country || "",
            DepartureAirportCity: child?.cust_airportCityDept || "",

            HomeAirportCity: child?.cust_homeairport || "",


            Location: child?.cust_location || "",
            LocationGroup: child?.cust_locationgrp || "",


            EmpFirstName: child?.cust_firstName || "",
            EmpMiddleName: child?.cust_middleName || "",
            EmpLastName: child?.cust_lastName || "",
            EmpTitle: child?.cust_title || "",

            EmailId: child?.cust_emailid || "",
            DateOfBirth: Utilities.convertToDateString(child?.cust_dob || ""),


            TravelwithFamily: child?.cust_travelWithFamily || "",
            NumberOfDependents: child?.cust_numberOfDependents || "",

            // Include family details
            ItsFamilyDetails: familyDetails,

            Status: "Open",


            // not required for now

            AnnualLeaveStartDate: "",
            AnnualLeaveEndDate: "",
            RotationalLeaveStartDate: "",
            RotationalLeaveEndDate: "",

            DepartmentCode: "",


            NationalID: "",


            ExpenseCode: "",
            ProjectCode: "",
            Class: "",

            WBS: "",
            WbsCodeDesc: "",
            InternalOrder: "",
            InternalOrderDesc: "",
            LegalEntityDesc: "",
            PersonalCost: "",
            CompanyName: "",
            DepartmentName: "",
          };
        });

      },

      generateHashMapArray: function (array, key) {
        const HashMap = new Map();
        array.forEach(item => {
          if (!HashMap.has(item[key])) {
            HashMap.set(item[key], []);
          }
          HashMap.get(item[key]).push(item);
        });
        return HashMap;
      },

      generateHashMap: function (array, key) {
        const HashMap = new Map();
        array.forEach(item => {
          HashMap.set(item[key], item);
        });
        return HashMap;
      },
    }
    const {
      TravelDetails,
      TravelFamilyDetails
    } = cds.entities('taqa.srv.TaqaDbService');
    let srv = cds.services['taqa.srv.TaqaDbService'];

    const baseURL = "/cust_businessTravelReqChild"; // changed cust_businessTravelReqParent to cust_businessTravelReqChild by Anto 06.10
    const filter = "cust_compcode ne '1000' and cust_compcode ne '2000' and cust_compcode ne '4000' and cust_compcode ne '4100' and cust_compcode ne '6000'";
    const parameters = {}; // This is an empty object, so no parameters to add.
    const expand = "cust_attachmentNav"; // changed cust_businessTravelRequestChild to ""  by Anto 06.10
    console.log("Before API call");
    let SFData = await Utilities.getSFData(baseURL, filter, parameters, expand); // cust_businessTravelReqParent, "cust_businessTravelRequestChild/cust_dependentdetailsNav,cust_travel_dependent_details", removed expand - Anto 06.10
    console.log("API API call");
    let processedData = TravelUtilities.processRecords(SFData);

    let TravelData = await SELECT.from(TravelDetails);
    let TravelDataMap = TravelUtilities.generateHashMapArray(TravelData, "EmployeeID");

    let createData = [], updateData = [];
    for (let obj of processedData) {
      let TravelStuff = TravelDataMap.get(obj?.EmployeeID || "") || [];

      let findTravel = TravelStuff.find(({ EmployeeID, TransactionSequence, EffectiveStartDate, ParentExternalCode }) => TransactionSequence === obj.TransactionSequence && EmployeeID === obj.EmployeeID && ParentExternalCode === obj.ParentExternalCode && EffectiveStartDate === obj.EffectiveStartDate);

      if (findTravel) {
        updateData.push({ ...obj, ID: findTravel?.ID ?? "" });
      }
      else {
        createData.push(obj);
      }
    }



    try {
      // console.log(testData)
      // console.log(createData);
      // console.log(updateData);
      if (createData.length > 0) {

        console.log("INSIDE CREATE");
        const results = await srv.create(TravelDetails).entries(createData);
      }
    } catch (error) {
      // throw new Error("Console.log")
      console.error(error);
    }

    // for (let obj of updateData) {
    //   const result = await srv.update(TravelDetails).set(obj).where({ ID: obj.ID });

    // }


  });


  this.on("GET", "GetDuplicate", async (req, next) => {
    const buildTimeSheetQuery = (top, skip) => {
      let query = `
          WITH DuplicateRecords AS (
              SELECT employeeId, projectCode, date
              FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS"
              WHERE DATE != '' AND DELETED = false
              GROUP BY employeeId, projectCode, date
              HAVING COUNT(*) > 1
          )
          SELECT *
          FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS" t
          INNER JOIN DuplicateRecords d
          ON t.employeeId = d.employeeId
          AND t.projectCode = d.projectCode
          AND t.date = d.date
      `;

      if (top && skip) {
        query += ` ORDER BY t.employeeId, t.projectCode, t.date, t.ID LIMIT ${top} OFFSET ${skip}`;
      }

      return query;
    }

    // Helper function to build query for Allowance
    const buildAllowanceQuery = (top, skip) => {
      let query = `
          WITH DuplicateRecords AS (
              SELECT employeeId, date, AllowanceID, Reversed, historyrecord
              FROM "TAQA"."TAQA_DB_ALLOWANCE"
              WHERE DATE != '' AND DELETED = false
              GROUP BY employeeId, date, AllowanceID, Reversed, historyrecord, status
              HAVING COUNT(*) > 1
          )
          SELECT *
          FROM "TAQA"."TAQA_DB_ALLOWANCE" t
          INNER JOIN DuplicateRecords d
          ON t.employeeId = d.employeeId
          AND t.allowanceID = d.allowanceid
          AND t.date = d.date
          AND t.reversed = d.reversed
          AND t.historyrecord = d.historyrecord
      `;

      if (top && skip) {
        query += ` ORDER BY t.employeeId, t.date, t.allowanceid, t.reversed, t.historyrecord LIMIT ${top} OFFSET ${skip}`;
      }

      return query;
    }

    // Helper function to map data based on the table name
    const mapData = (tableName, data) => {
      if (tableName === "/TimeSheetDetails") {
        return (data || []).map(oItem => ({
          createdAt: oItem.CREATEDAT,
          createdBy: oItem.CREATEDBY,
          modifiedAt: oItem.MODIFIEDAT,
          modifiedBy: oItem.MODIFIEDBY,
          ID: oItem.ID,
          AppID: oItem.APPID,
          Date: oItem.DATE,
          EmployeeID: oItem.EMPLOYEEID,
          EmployeeName: oItem.EMPLOYEENAME,
          Division: oItem.DIVISION,
          DivisionDesc: oItem.DIVISIONDESC,
          Department: oItem.DEPARTMENT,
          DepartmentDesc: oItem.DEPARTMENTDESC,
          StartDate: oItem.STARTDATE,
          EndDate: oItem.ENDDATE,
          Location: oItem.LOCATION,
          CostCenter: oItem.COSTCENTER,
          InternalOrder: oItem.INTERNALORDER,
          WbsCode: oItem.WBSCODE,
          JobTitle: oItem.JOBTITLE,
          JobCode: oItem.JOBCODE,
          OvertimeHours: oItem.OVERTIMEHOURS,
          TotalAmount: oItem.TOTALAMOUNT,
          Day: oItem.DAY,
          WorkType: oItem.WORKTYPE,
          RegularHours: oItem.REGULARHOURS,
          WorkedHours: oItem.WORKEDHOURS,
          TotalHours: oItem.TOTALHOURS,
          Absence: oItem.ABSENCE,
          Status: oItem.STATUS,
          Comment: oItem.COMMENT,
          Attachment: oItem.ATTACHMENT,
          FileName: oItem.FILENAME,
          SaleOfHours: oItem.SALEOFHOURS,
          HourlyRate: oItem.HOURLYRATE,
          Religion: oItem.RELIGION,
          EmployeeIs: oItem.EMPLOYEEIS,
          PayGrade: oItem.PAYGRADE,
          RotationalLeaveBalance: oItem.ROTATIONALLEAVEBALANCE,
          CustomerName: oItem.CUSTOMERNAME,
          ExternalCode: oItem.EXTERNALCODE,
          CompanyCode: oItem.COMPANYCODE,
          Workschedule: oItem.WORKSCHEDULE,
          WbsCodeDesc: oItem.WBSCODEDESC,
          InternalOrderDesc: oItem.INTERNALORDERDESC,
          CostCenterDesc: oItem.COSTCENTERDESC,
          LocationDesc: oItem.LOCATIONDESC,
          ActualStartDate: oItem.ACTUALSTARTDATE,
          ActualEndDate: oItem.ACTUALENDDATE,
          WbsCodeCode: oItem.WBS_CODE_CODE,
          OvertimeType: oItem.OVERTIMETYPE,
          OvertimeTypeDesc: oItem.OVERTIMETYPEDESC,
          ProjectDesc: oItem.PROJECTDESC,
          ProjectCode: oItem.PROJECTCODE,
          EmpEmailID: oItem.EMPEMAILID,
          LeaveAccrualIndicator: oItem.LEAVEACCRUALINDICATOR,
          QhseStatus: oItem.QHSESTATUS,
          ReturnIndicator: oItem.RETURNINDICATOR,
          Country: oItem.COUNTRY,
          LeaveCode: oItem.LEAVECODE,
          OperationalIndicator: oItem.OPERATIONALINDICATOR,
          CompanyCodeDesc: oItem.COMPANYCODEDESC,
          EditRecordIndicator: oItem.EDITRECORDINDICATOR,
          ...oItem
        }));
      } else if (tableName === "/Allowance") {
        return (data || []).map(oItem => ({
          createdAt: oItem.CREATEDAT,
          createdBy: oItem.CREATEDBY,
          modifiedAt: oItem.MODIFIEDAT,
          modifiedBy: oItem.MODIFIEDBY,
          parent_ID: oItem.PARENT_ID,
          parent_AppID: oItem.PARENT_APPID,
          parent_Date: oItem.PARENT_DATE,
          parent_EmployeeID: oItem.PARENT_EMPLOYEEID,
          parent_CostCenter: oItem.PARENT_COSTCENTER,
          parent_InternalOrder: oItem.PARENT_INTERNALORDER,
          parent_WbsCode: oItem.PARENT_WBSCODE,
          EmployeeID: oItem.EMPLOYEEID || "",
          Date: oItem.DATE || "",
          AllowanceID: oItem.ALLOWANCEID || "",
          CostCenter: oItem.COSTCENTER || "",
          InternalOrder: oItem.INTERNALORDER || "",
          WbsCode: oItem.WBSCODE || "",
          AllowanceDesc: oItem.ALLOWANCEDESC || "",
          Amount: oItem.AMOUNT || "",
          Number: oItem.NUMBER || "",
          ReferenceKey: oItem.REFERENCEKEY || "",
          Status: oItem.STATUS || "",
          Reversed: oItem.REVERSED || "",
          HistoryRecord: oItem.HISTORYRECORD || "",
          ErrorIndicator: oItem.ERRORINDICATOR || "",
          ...oItem
        }));
      }
      return data;
    }
    const { _queryOptions: { tableName, $top, $skip } = {} } = req;
    console.table(req);
    console.log("tablename", tableName);
    const queryMap = {
      "/TimeSheetDetails": buildTimeSheetQuery,
      "/Allowance": buildAllowanceQuery
    };

    const queryBuilder = queryMap[tableName];

    if (tableName && queryBuilder) {
      try {
        let query = queryBuilder($top, $skip);
        let data = await db.run(query);
        data = mapData(tableName, data);
        return data;
      } catch (error) {
        console.error("Error fetching data:", error);

        req.error(500, "Error fetching data:", error);
      }
    } else {
      console.log("TableName is not supported for fetching duplicates");
      req.error(500, 'TableName is not supported for fetching duplicates');
    }
  });

  this.on("GET", "GetDuplicateAllowance", async (req, next) => {
    const buildTimeSheetQuery = (top, skip) => {
      let query = `
        WITH DuplicateRecords AS (
            SELECT employeeId, projectCode, date
            FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS"
            WHERE DATE != '' AND DELETED = false
            GROUP BY employeeId, projectCode, date
            HAVING COUNT(*) > 1
        )
        SELECT *
        FROM "TAQA"."TAQA_DB_TIMESHEETDETAILS" t
        INNER JOIN DuplicateRecords d
        ON t.employeeId = d.employeeId
        AND t.projectCode = d.projectCode
        AND t.date = d.date
    `;

      if (top && skip) {
        query += ` ORDER BY t.employeeId, t.projectCode, t.date, t.ID LIMIT ${top} OFFSET ${skip}`;
      }

      return query;
    }

    // Helper function to build query for Allowance
    const buildAllowanceQuery = (top, skip) => {
      let query = `
        WITH DuplicateRecords AS (
            SELECT employeeId, date, AllowanceID, Reversed, historyrecord
            FROM "TAQA"."TAQA_DB_ALLOWANCE"
            WHERE DATE != '' AND DELETED = false
            GROUP BY employeeId, date, AllowanceID, Reversed, historyrecord, status
            HAVING COUNT(*) > 1
        )
        SELECT *
        FROM "TAQA"."TAQA_DB_ALLOWANCE" t
        INNER JOIN DuplicateRecords d
        ON t.employeeId = d.employeeId
        AND t.allowanceID = d.allowanceid
        AND t.date = d.date
        AND t.reversed = d.reversed
        AND t.historyrecord = d.historyrecord
    `;

      if (top && skip) {
        query += ` ORDER BY t.employeeId, t.date, t.allowanceid, t.reversed, t.historyrecord LIMIT ${top} OFFSET ${skip}`;
      }

      return query;
    }

    // Helper function to map data based on the table name
    const mapData = (tableName, data) => {
      if (tableName === "/TimeSheetDetails") {
        return (data || []).map(oItem => ({
          createdAt: oItem.CREATEDAT,
          createdBy: oItem.CREATEDBY,
          modifiedAt: oItem.MODIFIEDAT,
          modifiedBy: oItem.MODIFIEDBY,
          ID: oItem.ID,
          AppID: oItem.APPID,
          Date: oItem.DATE,
          EmployeeID: oItem.EMPLOYEEID,
          EmployeeName: oItem.EMPLOYEENAME,
          Division: oItem.DIVISION,
          DivisionDesc: oItem.DIVISIONDESC,
          Department: oItem.DEPARTMENT,
          DepartmentDesc: oItem.DEPARTMENTDESC,
          StartDate: oItem.STARTDATE,
          EndDate: oItem.ENDDATE,
          Location: oItem.LOCATION,
          CostCenter: oItem.COSTCENTER,
          InternalOrder: oItem.INTERNALORDER,
          WbsCode: oItem.WBSCODE,
          JobTitle: oItem.JOBTITLE,
          JobCode: oItem.JOBCODE,
          OvertimeHours: oItem.OVERTIMEHOURS,
          TotalAmount: oItem.TOTALAMOUNT,
          Day: oItem.DAY,
          WorkType: oItem.WORKTYPE,
          RegularHours: oItem.REGULARHOURS,
          WorkedHours: oItem.WORKEDHOURS,
          TotalHours: oItem.TOTALHOURS,
          Absence: oItem.ABSENCE,
          Status: oItem.STATUS,
          Comment: oItem.COMMENT,
          Attachment: oItem.ATTACHMENT,
          FileName: oItem.FILENAME,
          SaleOfHours: oItem.SALEOFHOURS,
          HourlyRate: oItem.HOURLYRATE,
          Religion: oItem.RELIGION,
          EmployeeIs: oItem.EMPLOYEEIS,
          PayGrade: oItem.PAYGRADE,
          RotationalLeaveBalance: oItem.ROTATIONALLEAVEBALANCE,
          CustomerName: oItem.CUSTOMERNAME,
          ExternalCode: oItem.EXTERNALCODE,
          CompanyCode: oItem.COMPANYCODE,
          Workschedule: oItem.WORKSCHEDULE,
          WbsCodeDesc: oItem.WBSCODEDESC,
          InternalOrderDesc: oItem.INTERNALORDERDESC,
          CostCenterDesc: oItem.COSTCENTERDESC,
          LocationDesc: oItem.LOCATIONDESC,
          ActualStartDate: oItem.ACTUALSTARTDATE,
          ActualEndDate: oItem.ACTUALENDDATE,
          WbsCodeCode: oItem.WBS_CODE_CODE,
          OvertimeType: oItem.OVERTIMETYPE,
          OvertimeTypeDesc: oItem.OVERTIMETYPEDESC,
          ProjectDesc: oItem.PROJECTDESC,
          ProjectCode: oItem.PROJECTCODE,
          EmpEmailID: oItem.EMPEMAILID,
          LeaveAccrualIndicator: oItem.LEAVEACCRUALINDICATOR,
          QhseStatus: oItem.QHSESTATUS,
          ReturnIndicator: oItem.RETURNINDICATOR,
          Country: oItem.COUNTRY,
          LeaveCode: oItem.LEAVECODE,
          OperationalIndicator: oItem.OPERATIONALINDICATOR,
          CompanyCodeDesc: oItem.COMPANYCODEDESC,
          EditRecordIndicator: oItem.EDITRECORDINDICATOR,
          ...oItem
        }));
      } else if (tableName === "/Allowance") {
        return (data || []).map(oItem => ({
          createdAt: oItem.CREATEDAT,
          createdBy: oItem.CREATEDBY,
          modifiedAt: oItem.MODIFIEDAT,
          modifiedBy: oItem.MODIFIEDBY,
          parent_ID: oItem.PARENT_ID,
          parent_AppID: oItem.PARENT_APPID,
          parent_Date: oItem.PARENT_DATE,
          parent_EmployeeID: oItem.PARENT_EMPLOYEEID,
          parent_CostCenter: oItem.PARENT_COSTCENTER,
          parent_InternalOrder: oItem.PARENT_INTERNALORDER,
          parent_WbsCode: oItem.PARENT_WBSCODE,
          EmployeeID: oItem.EMPLOYEEID || "",
          Date: oItem.DATE || "",
          AllowanceID: oItem.ALLOWANCEID || "",
          CostCenter: oItem.COSTCENTER || "",
          InternalOrder: oItem.INTERNALORDER || "",
          WbsCode: oItem.WBSCODE || "",
          AllowanceDesc: oItem.ALLOWANCEDESC || "",
          Amount: oItem.AMOUNT || "",
          Number: oItem.NUMBER || "",
          ReferenceKey: oItem.REFERENCEKEY || "",
          Status: oItem.STATUS || "",
          Reversed: oItem.REVERSED || "",
          HistoryRecord: oItem.HISTORYRECORD || "",
          ErrorIndicator: oItem.ERRORINDICATOR || "",
          ...oItem
        }));
      }
      return data;
    }
    const { _queryOptions: { tableName, $top, $skip } = {} } = req;
    console.table(req);
    console.log("tablename", tableName);
    const queryMap = {
      "/TimeSheetDetails": buildTimeSheetQuery,
      "/Allowance": buildAllowanceQuery
    };

    const queryBuilder = queryMap[tableName];

    if (tableName && queryBuilder) {
      try {
        let query = queryBuilder($top, $skip);
        let data = await db.run(query);
        data = mapData(tableName, data);
        return data;
      } catch (error) {
        console.error("Error fetching data:", error);

        req.error(500, "Error fetching data:", error);
      }
    } else {
      console.log("TableName is not supported for fetching duplicates");
      req.error(500, 'TableName is not supported for fetching duplicates');
    }
  });

  this.on("sendTravelEmail", async (req, next) => {
    const { base64pdf, receiverMail, fileName, name, focalPerson, ticketbook } = req.data;

    // Check if required fields are provided
    if (!receiverMail || !base64pdf || !fileName) {
      return req.error(400, "All parameters (receiverMail, base64pdf, fileName) are required.");
    }

    const sendermail = "successfactors@tq.com";
    const senderpassword = "G8JqANVr6@16";
    const acbase64pdf = Buffer.from(base64pdf, 'base64');
    const email = receiverMail; // Use receiverMail from the request data

    // Set up the transporter for Outlook
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: sendermail,
        pass: senderpassword,
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });

    // Define email content

    const bookingInformationsubject = "Ticket Booking Information"
    const tickerconfirmationsubject = "Ticket Information"



    // Set email body based on ticket booking status
    const emailBody = ticketbook ? "ticketbooking.html" : "ticketconfirmation.html";
    const emailsubject = ticketbook ? bookingInformationsubject : tickerconfirmationsubject;

    const path = require('path');
    const templatePath = path.join(__dirname, `./templates/${emailBody}`);
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders with actual values
    htmlTemplate = htmlTemplate
      .replace('{{name}}', name)
      .replace('{{focalperson}}', focalPerson);



    // Define the email options
    const mailOptions = {
      from: sendermail,
      to: email,
      subject: emailsubject,
      html: htmlTemplate,
      attachments: [
        {
          filename: fileName,
          content: acbase64pdf,
        }
      ]
    };

    // Send the email with error handling
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      return req.error(500, "Failed to send email. Please try again.");
    }
  });


  // const nodemailer = require('nodemailer');

  // this.on("sendTravelEmail", async (req, next) => {
  //     const sendermail = "successfactors@tq.com";
  //     const senderpassword = "G8JqANVr6@16";
  //     const email = "vprajeshwar@kaartech.com";

  //     const transporter = nodemailer.createTransport({
  //         host: 'smtp-mail.outlook.com',
  //         port: 587,
  //         secure: false,
  //         auth: {
  //             user: sendermail,
  //             pass: senderpassword,
  //         },
  //         tls: {
  //             ciphers: 'SSLv3',
  //         },
  //     });
  //     const path = require('path');
  //     const content = { name: "John Doe", event: "Annual Meetup", date: "2024-12-05", location: "New York" };
  //     const templatePath = path.join(__dirname, './templates/travel2.html');
  //     console.log("Attempting to read HTML template from:", templatePath);
  //     // Load the HTML templatesrv
  //     let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

  //     // Replace placeholders with actual values
  //     htmlTemplate = htmlTemplate
  //         .replace('{{name}}', content.name)
  //         .replace('{{event}}', content.event)
  //         .replace('{{date}}', content.date)
  //         .replace('{{location}}', content.location);

  //     const mailOptions = {
  //         from: sendermail,
  //         to: email,
  //         subject: "Event Invitation",
  //         html: htmlTemplate,
  //     };

  //     try {
  //         await transporter.sendMail(mailOptions);
  //         console.log("Email sent successfully");
  //     } catch (error) {
  //         console.error("Error sending email:", error);
  //         return req.error(500, "Failed to send email. Please try again.");
  //     }
  // });


  this.on("GET", "AbsenceRecordsFunc", async (req, next) => {
    const {
      TimeSheetDetails,
      RowInfo
    } = cds.entities('taqa.srv.TaqaDbService');
    const Utilities = {

      convertToDateString: (dateString) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Check if the Date object is valid
          // if (isNaN(date)) {
          //   throw new Error("Invalid timestamp");
          // }

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      generateDates: function (startDate, endDate, format = 1) {

        let currentDate = new Date(startDate);
        let datesArray = [];

        while (currentDate <= new Date(endDate)) {
          datesArray.push(Utilities.formatDate(currentDate, format));
          // Incrementing currentDate
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return datesArray;
      },

      constructURL: (baseURL, filter, parameters, expand = '', select = '', orderby = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty or undefined
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided and not empty
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        if (select) {
          queryParts.push(`$select=${encodeURIComponent(select)}`);
        }

        if (orderby) {
          queryParts.push(`$orderby=${encodeURIComponent(orderby)}`);

        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            // Ensure both key and value are URL encoded
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}` : `${baseURL}?`;

        return fullURL;
      },


      getSFData: async (baseURL, filter, parameters, expand, select, orderby) => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand, select, orderby);
        const batchSize = 1000; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}&$top=${batchSize}&$skip=${skip}`;
          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            data = data.concat(SFdata);

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error WITH API: " + error);
            console.log("Error : " + error);
            break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
      generateHashMapArray: function (array, key) {
        const HashMap = new Map();
        array.forEach(item => {
          if (!HashMap.has(item[key])) {
            HashMap.set(item[key], []);
          }
          HashMap.get(item[key]).push(item);
        });
        return HashMap;
      },
      formatDate: (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else if (format === 4) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      },
      getAdjustedDates: (dates, startDate, endDate, cutoffStartDate, cutoffEndDate) => {
        let minStartDate = dates[0][startDate];
        let maxEndDate = dates[0][endDate];

        dates.forEach((obj) => {
          if (obj[startDate] < minStartDate) minStartDate = obj[startDate];
          if (obj[endDate] > maxEndDate) maxEndDate = obj[endDate];
        });

        // Apply cutoff logic
        const adjustedStartDate = minStartDate < cutoffStartDate ? cutoffStartDate : minStartDate;
        const adjustedEndDate = maxEndDate > cutoffEndDate ? cutoffEndDate : maxEndDate;

        return { adjustedStartDate, adjustedEndDate };
      },
      updateArrayonPerPerson: function (array, key, perPersonData) {


        return array.map(element => {
          const employee = perPersonData.find(({ EmpUserEmail }) => EmpUserEmail === element[key]);
          return employee ? { ...element, EmployeeID: employee.EmployeeID, EmpUserEmail: employee.EmpUserEmail } : element;
        })
        // return perPersonData.map(element => {
        //     // Find the matching employee based on EmpUserEmail
        //     const employee = array.find(obj => obj[key] === element.EmpUserEmail);

        //     // If an employee is found, return a new object with updated properties
        //     return employee ? { ...employee, EmployeeID: element.EmployeeID, EmpUserEmail: element.EmpUserEmail} : employee;
        // });

      },
    };
    const formatDate = (date, format = 1) => {

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      if (format === 1) return `${year}-${month}-${day}`;
      else if (format === 2) return `${day}-${month}-${year}`;
      else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
      else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
    };

    const processMaintenanceData = (maintenanceData) => {
      const TableMaintenanceHelper = {
        getOverTimeException: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Exception")
            .map(oItem => ({
              WorkTypeCode: oItem?.Column1 ?? "",
              Hours: oItem?.Column2 ?? ""
            }));
        },
        getUAsettings: tableData => {
          return tableData
            .filter(object => object?.TableName === "UA settings")
            .map(oItem => oItem?.Column1 ?? "");
        },
        getOverTimeValidity: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Eligibility")
            .map(oItem => ({
              PayGrade: oItem?.Column2
            }));
        },
        getAMPSOvertimeDetails: tableData => {
          return tableData
            .filter(object => object?.TableName === "Overtime Location Formula")
            .map(oItem => ({
              Location: oItem?.Column2,
              Normal: oItem?.Column3,
              WeekOff: oItem?.Column4,
              Holiday: oItem?.Column5,
              Night: oItem?.Column6,
              NightHours: oItem?.Column7

            }));
        },
        getAllowancevalidity: tableData => {
          return tableData
            .filter(object => object?.TableName === "Allowances")
            .map(oItem => ({
              HanaID: oItem?.Column1 ?? "",
              AllowanceDesc: oItem?.Column2 ?? "",
              Amount: oItem?.Column3 ?? "",
              CompanyCode: oItem?.Column4 ?? "",
              Department: oItem?.Column6 ?? "",
              Location: oItem.Column10 ?? "",


              Import: oItem?.Column8 ?? "",
              AllowanceID: oItem.Column9 ?? "",
            }));


        },
        getAMPSCodes: tableData => {
          return tableData
            .filter(object => object?.TableName === "AMPS")
            .map(oItem => oItem?.Column1 ?? "");
        },


      };

      const OvertimeEligibility = TableMaintenanceHelper.getOverTimeValidity(maintenanceData);
      const AllowanceEligibility = TableMaintenanceHelper.getAllowancevalidity(maintenanceData);
      const AMPSCodes = TableMaintenanceHelper.getAMPSCodes(maintenanceData);
      const OvertimeException = TableMaintenanceHelper.getOverTimeException(maintenanceData);
      const AMPSOvertime = TableMaintenanceHelper.getAMPSOvertimeDetails(maintenanceData);

      const UASettings = TableMaintenanceHelper.getUAsettings(maintenanceData)

      return {
        OvertimeEligibility,
        AllowanceEligibility,
        AMPSCodes,
        OvertimeException,
        AMPSOvertime,
        UASettings

      }



    };

    const getWhereClause = (appid, d1, d2) => {
      return `
      ((AppID = '${appid}' OR AppID = 'PROALONOR') AND
      (
        (StartDate >= '${d1}' AND StartDate <= '${d2}') OR
        (EndDate >= '${d1}' AND EndDate <= '${d2}') OR
        (StartDate <= '${d1}' AND EndDate >= '${d2}')
      )) OR
     ((AppID = 'EMPTIM') AND (Date >= '${d1}' AND Date <= '${d2}'))
    `;

    }

    const oURLSettings = {
      Empjob: {
        mapData: (data, ampscodes) => {
          const employeeTypeMap = {
            "627826": "Rotational",
            "627825": "Regular",
          };

          const extractWSNumbers = (input, isAmps) => {
            if (isAmps) {
              const [firstNumber, secondNumber] = input.split('/');
              return firstNumber && secondNumber ? (parseInt(secondNumber) / parseInt(firstNumber)).toFixed(2) : '';
            }

            const match = input.match(/(\d+)\s*x\s*(\d+)/i);
            return match ? (parseInt(match[2]) / parseInt(match[1])).toFixed(2) : '';
          };

          return (data || []).map(oItem => ({
            EmployeeID: oItem?.userId ?? "",
            EmpUserEmail: oItem?.userId ?? "",
            EffectiveStartDate: Utilities.convertToDateString(oItem?.startDate || ""),
            EffectiveEndDate: Utilities.convertToDateString(oItem?.endDate || ""),
            EmployeeName: oItem?.userNav?.defaultFullName ?? "",
            Division: oItem?.division ?? "",
            DivisionDesc: oItem?.divisionNav?.name ?? "",
            Department: oItem?.department ?? "",
            DepartmentDesc: oItem?.departmentNav?.name ?? "",
            Location: oItem?.location ?? "",
            Country: oItem?.countryOfCompany ?? "",
            OperationalIndicator: oItem?.timeRecordingProfileCode ?? "",
            LocationDesc: oItem?.locationNav?.name ?? "",
            JobTitle: oItem?.jobTitle ?? "",
            CompanyCode: oItem?.company ?? "",
            CompanyCodeDesc: oItem?.companyNav?.name_defaultValue ?? "",
            Workschedule: oItem?.workscheduleCode ?? "",
            Religion: oItem?.Religion ?? "",
            PayGrade: oItem?.payGrade ?? "",
            EmpEmailID: oItem?.userNav?.email ?? "",
            OvertimeEligibility: oItem?.customString12 === '627151' ? 'X' : "",
            EmployeeIs: employeeTypeMap[oItem?.customString6] ?? "",
            RawbalanceAMPS: ampscodes.includes(oItem?.company) ? (oItem?.customString13Nav?.localeLabel ?? "") : "",
            RotationalLeaveBalance: employeeTypeMap[oItem?.customString6] === "Rotational"
              ? extractWSNumbers(ampscodes.includes(oItem?.company) ? (oItem?.customString13Nav?.localeLabel ?? "") : (oItem?.workscheduleCode ?? ""), ampscodes.includes(oItem?.company))
              : ""
          }));
        },
        getBaseURL: () => "/EmpJob",
        getOGFilter: (startDate, endDate, companyCode) => {
          const s = `startDate le datetime'${Utilities.formatDate(endDate, 4)}' and`;


        },
        
        getNewFilter: () => `lastModifiedOn ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}' and emplStatusNav/picklistLabels/label eq 'Active'`,
        getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getParameter: () => {
          return { 'fromDate': '1' }
        },
        getSelect: () => "userId,startDate,endDate,department,division,payGrade,standardHours,jobTitle,userNav/defaultFullName,userNav/displayName,divisionNav/name,departmentNav/name,locationNav/name,workingDaysPerWeek,customString6,company,location,workscheduleCode,emplStatusNav/picklistLabels,userNav/email,timeRecordingProfileCode,countryOfCompany,companyNav/name_defaultValue,customString13Nav/localeLabel,customString12", // localeLabel
        getOrderBy: () => `userId asc,startDate asc,endDate asc`, // department asc, division asc, company asc, location asc, workscheduleCode asc, startDate asc, endDate asc, paygrade asc, standardHours asc, jobTitle asc
        getExpand: () => "userNav,companyNav,divisionNav,departmentNav,locationNav,emplStatusNav/picklistLabels,customString13Nav"
      },
      perperson: {
        mapData: (perpersonData) => (perpersonData || []).map(oItem => ({
          EmployeeID: oItem?.personIdExternal ?? "",
          EmpUserEmail: oItem?.userAccountNav?.user?.results[0]?.userId ?? ""
        })),
        getBaseURL: () => "/PerPerson",
        getFilter: (EmployeeIDList, key = "userAccountNav/user/userId") => {
          // const ids = EmployeeIDList.map(id => `'${id}'`).join(", ");
          // return `(${key} in (${ids}))`;
          const Filter = EmployeeIDList.map(id => `${key} eq '${id}'`).join(' or ');
          return "(" + Filter + ")";
        },
        getExpand: () => "userAccountNav,userAccountNav/user",


      },

      Absence: {
        mapData: (absenceDataArg) => {
          const absenceData = (absenceDataArg || []).filter(oItem => oItem.timeTypeNav.category === "ABSENCE");
          return absenceData.flatMap(oItem => {
            return Utilities.generateDates(Utilities.convertToDateString(oItem?.startDate), Utilities.convertToDateString(oItem?.endDate))
              .map(date => ({
                LeaveCode: oItem?.timeType ?? "",
                EmployeeID: oItem?.userId ?? "",
                Date: date ?? "",
                Reason: oItem?.timeTypeNav?.externalName_defaultValue ?? "",
                ApprovalStatus: oItem?.approvalStatus ?? ""
              }));
          });
        },
        getBaseURL: () => "/EmployeeTime",
        getNewFilter: () => `lastModifiedDateTime ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}'`,
        getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "timeTypeNav"
      },

      Allowance: {
        mapData: (Allowances) => (Allowances || []).map(oItem => ({
          EmployeeID: oItem?.userId ?? "",
          // EmpUserEmail: oItem?.userId ?? "",
          AllowanceDesc: oItem?.payComponentNav?.name ?? "",
          AllowanceID: oItem?.payComponent ?? "",
          Amount: oItem?.paycompvalue ?? "",
          StartDate: Utilities.convertToDateString(oItem?.startDate || ""),
          EndDate: Utilities.convertToDateString(oItem?.endDate || "")
        })),
        getBaseURL: () => "/EmpPayCompRecurring",
        getNewFilter: () => `lastModifiedDateTime ge datetime'${Utilities.formatDate(lastupdatedDate, 4)}'`,
        getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "payComponentNav"
      },

      Workschedule: {
        mapData: (workingHoursData) => (workingHoursData || []).map(oItem => ({
          Workschedule: oItem?.externalCode ?? "",
          WorkingHours: oItem?.workScheduleDays?.results?.map(oHours => oHours?.workingHours)
        })),

        getBaseURL: () => "/WorkSchedule",
        getFilter: (workSchedules, key) => workSchedules.map(id => `${key} eq '${id}'`).join(' or '),
        getExpand: () => "workScheduleDays"
      },

      Holiday: {
        mapData: (Holidays) => {
          return (Holidays || []).flatMap(oItem => {
            const Country = oItem?.country || "";
            return (oItem?.holidayAssignments?.results || []).map(Holiday => ({
              Country,
              Name: Holiday?.holidayNav?.name_defaultValue || "",
              Date: Utilities.convertToDateString(Holiday?.date)
            }));
          });
        },
        getBaseURL: () => "/HolidayCalendar",
        getFilter: () => "",
        // getFilter: (EmployeeID, EmpUserEmail) => EmpUserEmail ? `(userId eq ${EmployeeID} or userId eq ${EmpUserEmail})` : `(userId eq ${EmployeeID})`,
        getExpand: () => "countryNav,holidayAssignments,holidayAssignments/holidayNav"
      }
    };

    let EmpJobkey = "Empjob", AbsenceKey = "Absence", Allowancekey = "Allowance",
      workscheduleKey = "Workschedule", HolidayKey = "Holiday", perpersonKey = "perperson";

    const isUnAuthorised = (Assignment, TimeSheetData, currentDate, ID, holidayData) => {
      const formattedDate = formatDate(currentDate);

      const isValidAssignment = Assignment.find(obj => obj.StartDate <= formattedDate && obj.EndDate >= formattedDate);

      const isTimesheetMissing = isValidAssignment &&
        !TimeSheetData.some(obj => obj.EmployeeID === ID && obj.Date === formattedDate && obj.Status !== "Open" && obj.Status !== "Draft" && obj.LeaveCode === "");

      const Timesheet = TimeSheetData.find(obj => obj.EmployeeID === ID && obj.Date === formattedDate);
      const isAbsence = Timesheet !== undefined && (Timesheet?.LeaveCode != '' || Timesheet?.WorkType !== 'Absent');

      const isHoldiayAndOpenInDB = (Timesheet?.Status == "Open" || Timesheet?.Status === 'Draft') && Timesheet?.LeaveCode === '' && Timesheet?.Absence !== '' && Timesheet?.Absence !== 'Week-Off'

      const isHoliday = holidayData.some(obj => obj.Date === formattedDate && obj.Country === isValidAssignment?.Country);

      return isTimesheetMissing && !isHoliday && !isAbsence && !isHoldiayAndOpenInDB;
    };

    const isWeekoffUnAuthorised = (Assignment, workingHoursData, TimeSheetData, currentDate, ID, holidayData) => {

      const getPreviousOrNextWorkingDay = (date, workingHours, direction) => {
        let tempDate = new Date(date);
        let daysOffset = direction === 'previous' ? -1 : 1;
        let workingHoursForDay;
        do {
          tempDate.setDate(tempDate.getDate() + daysOffset);
          workingHoursForDay = workingHours[((tempDate.getDay() + 6) % 7)];

          // If there is no '0' in the workingHoursData, assume all days are working
          if (workingHours.every(day => day !== '0') || workingHoursForDay !== '0') {
            return tempDate;
          }
        } while (workingHoursForDay === '0');

        return tempDate;
      };

      const yesterdayDate = getPreviousOrNextWorkingDay(currentDate, workingHoursData, 'previous');
      const tomorrowDate = getPreviousOrNextWorkingDay(currentDate, workingHoursData, 'next');

      const beforeUnauthorized = isUnAuthorised(Assignment, TimeSheetData, yesterdayDate, ID, holidayData);
      const afterUnauthorized = isUnAuthorised(Assignment, TimeSheetData, tomorrowDate, ID, holidayData);

      return beforeUnauthorized && afterUnauthorized;
    };

    function isGreaterOrEqual(inputString, referenceString = "PG13") {
      // Normalize the input and reference strings
      const normalizedInput = inputString.toUpperCase();
      const normalizedReference = referenceString.toUpperCase();

      // Check if the input is "NA" or "N/A"
      if (normalizedInput === "NA") {
        return true; // Ignore NA; consider it greater or do whatever logic you want
      }

      // Extract the alphabetical and numeric parts
      const [inputPrefix, inputNumber] = extractParts(normalizedInput);
      const [referencePrefix, referenceNumber] = extractParts(normalizedReference);

      // Compare the prefixes
      if (inputPrefix > referencePrefix) {
        return true; // input is greater
      } else if (inputPrefix < referencePrefix) {
        return false; // input is lesser
      } else {
        // If prefixes are equal, compare numeric parts
        return parseInt(inputNumber, 10) >= parseInt(referenceNumber, 10);
      }
    }

    // Helper function to extract the prefix and numeric part
    function extractParts(str) {
      const match = str.match(/^([A-Za-z]+)(\d+)$/);
      return match ? [match[1], match[2]] : [str, "0"]; // Return the parts or default if not matched
    }

    const tx = cds.transaction();
    try {

    const today = new Date();

    // Calculate the date two months before today
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 4);
    // const sDate = formatDate(pastDate);
    // const eDate = formatDate(today);

    const sDate = "2024-11-16";
    const eDate = "2024-12-15";

    const whereclause = getWhereClause("PROALO", sDate, eDate);
    const TimeSheetQuery = SELECT.from(TimeSheetDetails, ts => {
      ts('*'); // Select all fields from TimeSheetDetails
      ts.ItsAllowances(a => a('*')); // Select all fields from ItsAllowances association
    }).where(whereclause);

    const TimesheetData = await TimeSheetQuery;
    const EmployeeIDS = [...new Set(TimesheetData.map(employee => employee.EmployeeID))];

    const TimesheetDataMap1 = Utilities.generateHashMapArray(TimesheetData, "EmployeeID");
    const TimesheetDataMap2 = Utilities.generateHashMapArray(TimesheetData, "EmpUserEmail");


    const Workschedules = [...new Set(TimesheetData.map(employee => employee.Workschedule))];


    const WorkScheduleRawData = await Utilities.getSFData(
      oURLSettings[workscheduleKey].getBaseURL(),
      oURLSettings[workscheduleKey].getFilter(Workschedules, "externalCode"),
      {},
      oURLSettings[workscheduleKey].getExpand()
    );

    const WorkScheduleData = oURLSettings[workscheduleKey].mapData(WorkScheduleRawData);

    const HolidaysRawdata = await Utilities.getSFData(
      oURLSettings[HolidayKey].getBaseURL(),
      oURLSettings[HolidayKey].getFilter(),
      {},
      oURLSettings[HolidayKey].getExpand()
    );

    const Holidays = oURLSettings[HolidayKey].mapData(HolidaysRawdata);

    const maintenanceRawData = await SELECT.from(RowInfo);
    const maintenanceData = processMaintenanceData(maintenanceRawData)

    const { UASettings } = maintenanceData;



    const queries = [];
    const createData = [];
    const ECpayload = [];
    console.log("Employees going for update", EmployeeIDS);
    EmployeeIDS.forEach(ID => {
      //UASettings.includes(obj.CompanyCode) && && obj.Workschedule !== "5D8HSUNTHU"
      const EmployeeTimeSheetData = (TimesheetDataMap1.get(ID) || []).filter(obj => UASettings.includes(obj.CompanyCode) && obj.Workschedule !== "5D8HSUNTHU" && obj.CompanyCode !== "1000" && !isGreaterOrEqual(obj.PayGrade));
      const Assignments = EmployeeTimeSheetData.filter(obj => obj.AppID === "PROALO");

      if (EmployeeTimeSheetData.length === 0) return;

      let currentDate = new Date(sDate);
      const endDate = new Date(eDate);

      console.log("ID", ID);
      while (currentDate <= endDate) {
        const formattedDate = formatDate(currentDate);

        const ValidAssignments = Assignments.filter(obj => obj.StartDate <= formattedDate && obj.EndDate >= formattedDate);
        if (ValidAssignments.length > 0) {

          const Holiday = Holidays.find(obj => obj.Date === formattedDate && obj.Country === ValidAssignments[0].Country);
          const wrkdy = WorkScheduleData.find(obj => obj.Workschedule === ValidAssignments[0].Workschedule);

          if (Holiday) {
            console.log("Convinent stop")
          }
          const dayOfWeek = currentDate.getDay();
          const offsetDayOfWeek = (dayOfWeek + 6) % 7;
          const workingHours = wrkdy?.WorkingHours[offsetDayOfWeek];

          const isWeekOff = workingHours === "0";
          const weekOffCase = isWeekOff ? isWeekoffUnAuthorised(ValidAssignments, wrkdy?.WorkingHours, EmployeeTimeSheetData, currentDate, ID, Holidays) : false;

          const TimesheetData = EmployeeTimeSheetData.filter(obj => obj.Date === formattedDate);
          let count = 0;


          ValidAssignments.forEach(Assign => {

            const Allowance = {
              EmployeeID: Assign.EmployeeID,
              WbsCode: Assign.WbsCode ?? "",
              InternalOrder: Assign.InternalOrder ?? "",
              CostCenter: Assign.CostCenter ?? "",
              Reversed: "",
              Number: "1.00",
              Date: formatDate(currentDate),
              AllowanceID: "3007",
              AllowanceDesc: "UnAuthorised Absence",
              Status: "Replicated",
              HistoryRecord: "",
              Reversed: "",
              ReferenceKey: Assign.EmployeeID + formatDate(currentDate, 3) + "3007"
            }
            const payload = {
              REVERSED: "",
              EMPLOYEENUMBER: Assign.EmployeeID ?? "",
              VALIDITYDATE: formatDate(currentDate) ?? "",
              WAGETYPE: "3007",
              NUMBER: "1",
              Time_Measurement_Unit: "",
              AMOUNT: "",
              Referencekey: Assign.EmployeeID + formatDate(currentDate, 3) + "3007",
              CostCenter: Assign.CostCenter ?? "",
              WBS: Assign.WbsCode ?? "",
              InternalOrder: Assign.InternalOrder ?? "",
              NetworkNumber: "",
              ActivityNumber: "",
              LogicalSystemSource: "BTP",
              Reference_Transc: "EXT"
            }

            const canAddAlowance = !(count > 1);
            const isRecordPresent = TimesheetData.find(obj => obj.ProjectCode === Assign.ProjectCode) ? true : false;
            const isSubmittedOrApproved = TimesheetData.find(obj => obj.ProjectCode === Assign.ProjectCode && obj.Status !== "Open" && obj.Status !== "Draft" )
            const isEditted = TimesheetData.find(obj => obj.ProjectCode === Assign.ProjectCode && obj.EditRecordIndicator === 'X')
            const isHoldiayAndOpenInDB = TimesheetData.find(obj => obj.ProjectCode === Assign.ProjectCode && (obj.Status == "Open" || obj.Status === 'Draft') && obj.LeaveCode === '' && obj.Absence !== '' && obj.Absence !== 'Week-Off')
            const toBeUpdated = !isSubmittedOrApproved && isRecordPresent;


            console.log("Inside Date", ID, currentDate, isWeekOff, weekOffCase, Holiday, isSubmittedOrApproved, isEditted,  isHoldiayAndOpenInDB);
            if (((isWeekOff && weekOffCase) || !isWeekOff) && !Holiday && !isSubmittedOrApproved && !isEditted &&  !isHoldiayAndOpenInDB) {
              console.log("Success", ID, currentDate);
              if (toBeUpdated) {
                const item = TimesheetData.find(obj => obj.ProjectCode === Assign.ProjectCode);
                const UpdateItem = {
                  WorkType: "Absent",
                  LeaveCode: "UN_AUTH_SYSTEM",
                  Absence: "Un-Authorised Absence",
                  Status: "Approved",
                  WorkedHours: "0.00",
                  TotalHours: "0.00",
                  TotalAmount: "0.00",
                  ItsAllowances: canAddAlowance ? [Allowance] : []
                };

                const UpdateQuery = UPDATE(TimeSheetDetails)
                  .set(UpdateItem)
                  .where({
                    ID: item.ID,
                    EmployeeID: item.EmployeeID,
                    AppID: item.AppID,
                    Date: item.Date,
                    WbsCode: item.WbsCode,
                    InternalOrder: item.InternalOrder,
                    CostCenter: item.CostCenter
                  });
                queries.push(UpdateQuery);

              } else {
                let { __metadata, ID, createdAt, modifiedAt, createdBy, modifiedBy, ...copy } = Assign;
                const createItem = {
                  ...copy,
                  Date: formattedDate,
                  AppID: "EMPTIM",
                  WorkType: "Absent",
                  LeaveCode: "UN_AUTH_SYSTEM",
                  Absence: "Un-Authorised Absence",
                  Status: "Approved",
                  WorkedHours: "0.00",
                  TotalHours: "0.00",
                  TotalAmount: "0.00",
                  ItsAllowances: canAddAlowance ? [Allowance] : []
                }

                createData.push(createItem);
              }

              if (canAddAlowance) {
                ECpayload.push(payload);
              }
              count += 1;
            }




          });



        }
        currentDate.setDate(currentDate.getDate() + 1);

      }



    });

    let srv = cds.services['taqa.srv.TaqaDbService'];

    const createQuery = srv.create(TimeSheetDetails).entries(createData);
    if (createData.length > 0) {
      queries.push(createQuery);
    }


    
      await tx.run([...queries]);

      await tx.commit(); // Commit the transaction (unlock the records)

      return ECpayload;

    }
    catch (err) {
      console.error(err);
      await tx.rollback(); // Rollback the transaction if something fails
      throw err; // Rethrow the error to handle it outside
    }





  });

  this.on("sendEditNotification", async (req, next) => {
    const { receiverMail, editnotificationdata, name, AdminName, EditedDate } = req.data;

    // Check if required fields are provided

    const sendermail = "successfactors@tq.com";
    const senderpassword = "G8JqANVr6@16";

    const email = receiverMail; // Use receiverMail from the request data

    // Set up the transporter for Outlook
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: sendermail,
        pass: senderpassword,
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });


    const emailBody = "editnotificationtable.html";
    const emailsubject = "Timesheet Edited";

    const path = require('path');
    const templatePath = path.join(__dirname, `./templates/${emailBody}`);
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    const tableRows = editnotificationdata.map(
      (data) => `
        <tr>
            <td>${data.Date}</td>
            <td>${data.OldWorkType}</td>
              <td>${data.NewWorkType}</td>
              <td>${data.OldOvertime}</td>
                <td>${data.NewOvertime}</td>
               <td>${data.AllowanceAdded}</td>
              <td>${data.AllowanceRemoved}</td>
        </tr>`
    )
      .join("");
    htmlTemplate = htmlTemplate.replace("{{tableRows}}", tableRows)
      .replace('{{name}}', name)
      .replace('{{EditedDate}}', EditedDate)
      .replace('{{AdminName}}', AdminName);
    // // Replace placeholders with actual values
    // htmlTemplate = htmlTemplate
    //   .replace('{{name}}', name)
    //   .replace('{{focalperson}}', focalPerson);



    // Define the email options
    const mailOptions = {
      from: sendermail,
      to: email,
      subject: emailsubject,
      html: htmlTemplate,
    };

    // Send the email with error handling
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      return req.error(500, "Failed to send email. Please try again.");
    }
  });
  // this.on("SummaryReportNotification", async (req, next) => {
  //   const { receiverMail, editnotificationdata, name, AdminName, EditedDate } = req.data;

  //   // Check if required fields are provided

  //   const sendermail = "successfactors@tq.com";
  //   const senderpassword = "G8JqANVr6@16";

  //   const email = receiverMail; // Use receiverMail from the request data
  //   const workbook = XLSX.utils.book_new();
  //   const worksheet = XLSX.utils.json_to_sheet(editnotificationdata);
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Edit Notifications");

  //   const excelBuffer = XLSX.write(workbook, {
  //     type: "buffer",
  //     bookType: "xlsx",
  //   });
  //   // Set up the transporter for Outlook
  //   const transporter = nodemailer.createTransport({
  //     host: 'smtp-mail.outlook.com',
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: sendermail,
  //       pass: senderpassword,
  //     },
  //     tls: {
  //       ciphers: 'SSLv3',
  //     },
  //   });


  //   const emailBody = "editnotificationtable.html";
  //   const emailsubject = "Timesheet Edited";

  //   const path = require('path');
  //   const templatePath = path.join(__dirname, `./templates/${emailBody}`);
  //   let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
  //   const tableRows = editnotificationdata.map(
  //     (data) => `
  //       <tr>
  //           <td>${data.Date}</td>
  //           <td>${data.OldWorkType}</td>
  //             <td>${data.NewWorkType}</td>
  //             <td>${data.OldOvertime}</td>
  //               <td>${data.NewOvertime}</td>
  //              <td>${data.AllowanceAdded}</td>
  //             <td>${data.AllowanceRemoved}</td>
  //       </tr>`
  //   )
  //     .join("");
  //   htmlTemplate = htmlTemplate.replace("{{tableRows}}", tableRows)
  //     .replace('{{name}}', name)
  //     .replace('{{EditedDate}}', EditedDate)
  //     .replace('{{AdminName}}', AdminName);
  //   // // Replace placeholders with actual values
  //   // htmlTemplate = htmlTemplate
  //   //   .replace('{{name}}', name)
  //   //   .replace('{{focalperson}}', focalPerson);



  //   // Define the email options
  //   const mailOptions = {
  //     from: sendermail,
  //     to: email,
  //     subject: emailsubject,
  //     html: htmlTemplate,
  //     attachments: [
  //       {
  //         filename: `Timesheet_Edits_${EditedDate}.xlsx`,
  //         content: excelBuffer,
  //         contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //       },
  //     ],
  //   };

  //   // Send the email with error handling
  //   try {
  //     await transporter.sendMail(mailOptions);
  //     console.log("Email sent successfully");
  //   } catch (error) {
  //     console.error("Error sending email:", error);
  //     return req.error(500, "Failed to send email. Please try again.");
  //   }
  // });


  this.on("GET", "ClaimMasterDataUpdate", async (req, next) => {
    const Utilities = {
      convertToDateString: (dateString, mode = 1) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Check if the Date object is valid
          // if (isNaN(date)) {
          //   throw new Error("Invalid timestamp");
          // }

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');

          if (mode === 1) {
            return `${year}-${month}-${day}`;
          }
          // ISO 8601 format: yyyy-mm-ddThh:mm:ss
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;


        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      constructURL: (baseURL, filter, parameters, expand = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty or undefined
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided and not empty
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            // Ensure both key and value are URL encoded
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}&` : baseURL;

        return fullURL;
      },

      getEmpName: function (value) {

        if (value !== "" && value !== undefined) {

          let str = value;

          let result = str.replace(/null/g, ''); // Removes all occurrences of "null"

          result = result.trim();

          // console.log(result.trim());

          return result;

        }

        else {

          return value;

        }

      },


      getSFData: async (baseURL, filter, parameters, expand, mode = '') => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand);
        const batchSize = 100; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}$top=${batchSize}&$skip=${skip}`;
          console.log("URL INFO", url, paginatedUrl);
          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            if(mode !== 'CL-1' && mode !== 'CL-2'){
              data = data.concat(SFdata);
            }

            
            if(mode === 'CL-1' || mode === 'CL-2'){
              console.log("Result has come!");
              const res = await HandleDATA(SFdata, mode)
            }

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error WITH API: " + error);
            console.log("Error : " + error);
            // throw error;
            skip += batchSize;

            // break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
    };

    /*
       BenefitEmployeeClaim
       BenefitEmployeeClaim?recordStatus=pending
       EmpJob



    */

    
    async function fetchEmployeeDataInBatches(EmployeeIDs, oURLSettings, key, filterKey = 'userId', useSelect = false) {
      const BATCH_SIZE = 100;
      const results = [];

      // Split EmployeeIDs into chunks of 100
      for (let i = 0; i < EmployeeIDs.length; i += BATCH_SIZE) {
        const batch = EmployeeIDs.slice(i, i + BATCH_SIZE);

        // Get filter for current batch
        const filter = oURLSettings[key].getFilter(batch, filterKey);

        // Fetch data for the current batch
        const batchData = await Utilities.getSFData(
          oURLSettings[key].getBaseURL(),
          filter,
          {},
          oURLSettings[key].getExpand(),
          useSelect ? oURLSettings[key].getSelect() : null
        );

        // Combine results
        results.push(...batchData);
      }

      return results;
    }

    async function fetchApproverName(claim) {

      const stepNav = claim?.wfRequestNav?.results[0]?.wfRequestStepNav?.results;

      let results;

      if (stepNav) {
        let ClaimWorkFlowArray = [];
        let ownerIdFound = false;
        const ownerIds = [], postionCodes = [];
        // let postionCode;

        stepNav?.forEach(oItem => {
          if (oItem?.ownerId) {
            ownerIdFound = true;
            ownerIds.push(oItem?.ownerId)
          }
          if (oItem?.positionNav?.results[0]?.code) {
            postionCodes.push(oItem?.positionNav?.results[0]?.code);
          }

        });

        if (ownerIdFound && ownerIds.length > 0) {
          // call empJob
          results = await fetchEmployeeDataInBatches(ownerIds, oURLSettings, "EmpJob");

          stepNav?.forEach(oItem => {
            const approver = results.find(emp => emp.userId === oItem?.ownerId);
            oItem.approverName = approver?.userNav?.displayName || " ";
            // let WfData = {
            //   Status: oItem.status || "",
            //   Level: oItem.stepNum || "",
            //   ApproverName: oItem.approverName || "",
            //   LastModifiedDateTime: Utilities.convertToDateString(oItem.lastModifiedDateTime || "", 2)
      
            // }
            // ClaimWorkFlowArray.push(WfData);

          });

        }
        else if (postionCodes.length > 0) {
          // call empjob with position filter
          results = await fetchEmployeeDataInBatches(postionCodes, oURLSettings, "EmpJob", "position");
          stepNav?.forEach(oItem => {
            const approver = results.find(emp => emp.position === oItem?.positionNav.results[0].code);
            oItem.approverName = approver?.userNav?.displayName || " ";
            // let WfData = {
            //   Status: oItem.status || "",
            //   Level: oItem.stepNum || "",
            //   ApproverName: oItem.approverName || "",
            //   LastModifiedDateTime: Utilities.convertToDateString(oItem.lastModifiedDateTime || "", 2)
      
            // }
            // ClaimWorkFlowArray.push(WfData);

          });
        }


        if (stepNav) {

          const allCompleted = stepNav.every(step => step.status === 'COMPLETED');
          const allPending = stepNav.every(step => step.status === 'PENDING');
          let targetStep;
          if (allCompleted) {
            targetStep = stepNav.reduce((maxStep, currentStep) =>
              currentStep.stepNum > (maxStep?.stepNum || 0) ? currentStep : maxStep
              , null);
          } else if (allPending) {

            targetStep = stepNav.reduce((minStep, currentStep) =>
              currentStep.stepNum < (minStep?.stepNum || Number.MAX_SAFE_INTEGER) ? currentStep : minStep
              , null);
          } else {
            targetStep = stepNav.filter(step => step.status === 'PENDING').reduce((maxPendingStep, currentStep) =>
              currentStep.stepNum > (maxPendingStep?.stepNum || 0) ? currentStep : maxPendingStep
              , null);
          }
       
          stepNav.forEach(element => {
            let WfData = {
              Status: element.status || "",
              Level: element.stepNum || "",
              ApproverName: element.approverName || "",
              LastModifiedDateTime: Utilities.convertToDateString(element.lastModifiedDateTime || "",2)
      
            }
            ClaimWorkFlowArray.push(WfData);
          });
          claim.ClaimsStepNav = ClaimWorkFlowArray;
    
          claim.ApproverName = targetStep?.approverName || " ";

        }
        claim.wfRequestNav.results[0].wfRequestStepNav.results = stepNav;

      }

      return claim;


    }

    function getBenefitTypeColumnsAndValues(claimItem) {
      const benefitMappings = {
        GESR: "cust_benGeneralESR",
        AT10: "cust_benAirticket",
        MI10: "cust_medicalSubClaim",
        FTA10: "cust_fulltuitionassistance",
        ED10: "cust_EducationMonthly",
        CE10: "cust_benClientEntertainment",
        VMCR10: "cust_benVisaMedicalCostReimbursement",
        UID: "cust_benUnifiedID_VisaReimbursement",
        HRA: "cust_HRAClaim",
        MC: "cust_MobileClaim",
        BTR: "cust_BusinessTravelReimbursement",
        MF: "cust_MembershipFees",
        VE: "cust_Visa_Expenses",
        NSCDT1001: "cust_NonSaudiCareerDevelopmentTraining",
        SCDT1001: "cust_CareerDevelopementtraining",
        TQ11: "benefitDependentDetail",
        TQ07: "benefitDependentDetail",
        TQ09: "benefitDependentDetail",
        TQ04: "benefitEmployeeClaimDetail",
        TQ10: "benefitDependentDetail",
        TQ02: "benefitEmployeeClaimDetail",
        TQ05: "benefitEmployeeClaimDetail",
        TQ03: "benefitEmployeeClaimDetail",
        TQ16: "benefitEmployeeClaimDetail",
        ERF1001: "cust_Exit_ReentryFees"
      };

      let claimResult = [];

      for (const [prefix, key] of Object.entries(benefitMappings)) {
        if (claimItem.benefit.startsWith(prefix) || claimItem.benefit === prefix) {
          const data = claimItem[key];
          if (data && Array.isArray(data.results)) {
            claimResult = claimResult.concat(data.results);
          }
          break;
        }
      }

      return claimResult;
    }

    async function HandleDATA(mainData, mode){
      const tx = cds.transaction();
      try{

      
      const queries = []; 
      const createData = [];
      
      const BenefitEmployeeClaimSettings = oURLSettings["BenefitEmployeeClaim"];
      const UniqueEmployees = [...new Set([...mainData.map(oItem => oItem.workerId)])];
      const EmployeeData = await fetchEmployeeDataInBatches(UniqueEmployees, oURLSettings, "EmpJob");

      const EmployeeDataMap = new Map();
      EmployeeData.forEach(item => {
        EmployeeDataMap.set(item.userId, item);
      });

      if(mode === 'CL-1'){
        const ApprovedDataIDs = [...new Set([...mainData.map(oItem => oItem.id)])];

        const promisesWithIds = ApprovedDataIDs.map(id =>
          Utilities.getSFData(
            `${BenefitEmployeeClaimSettings.getBaseURL()}('${id}')/wfRequestNav`,
            "",
            {},
            "wfRequestStepNav/positionNav,wfRequestCommentsNav,wfRequestParticipatorNav,wfRequestStepNav"
          ).then(data => ({ id, "data": data[0] }))
        );
  
        // Step 2: Await all promises and get results
        const results = await Promise.all(promisesWithIds);
  
        results.forEach(item => {
          const main = mainData.find(obj => obj.id === item.id);
  
          if (main) {
            main.wfRequestNav.results = [];
            main.wfRequestNav.results[0] = item.data;
          }
        });
      }

      const promises = [...mainData].map(claim => fetchApproverName(claim));
      const AllClaims = await Promise.all(promises);

      const {ClaimReports} = cds.entities('taqa.srv.TaqaDbService');

      const HanaClaims = await SELECT.from(ClaimReports, cs => {
        cs('ClaimId')
      });

      const HanaClaimsMap = new Map();
      HanaClaims.forEach(item => {
        HanaClaimsMap.set(item.ClaimId, item);
      });

      const mimeTypes = {
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "txt": "text/plain",
        "html": "text/html",
        "htm": "text/html",
        "json": "application/json",
        "csv": "text/csv",
        "xml": "application/xml",
        "zip": "application/zip",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };
      const res = AllClaims.map(claimItem => {

        const claimResult = getBenefitTypeColumnsAndValues(claimItem);
        const empDetail = EmployeeDataMap.get(claimItem?.workerId); //EmployeeData.find(emp => emp.userId == claimItem.workerId);
     
        const mainClaim = {
            // ---- to be filled by gayu
            Status:claimItem?.wfRequestNav?.status || claimItem?.wfRequestNav?.results?.[0]?.status || '',
            Approver: claimItem?.ApproverName || '',
            EmployeeNumber: claimItem?.workerId || '',
            EmployeeName: claimItem?.workerIdNav?.displayName || '',
            ClaimId: claimItem?.id || '',
            BenefitCode: claimItem?.benefit || '',
            ProcessDescription: claimItem?.benefitNav?.results?.[0]?.benefitName || '',
            ESRCreatedDate: Utilities.convertToDateString(claimItem?.claimDate || ""),
            CompanyCode: empDetail?.company || '',
            CompanyDescription: empDetail?.companyNav?.name_defaultValue || '',
            JobTitle: empDetail?.jobTitle || '',
            Function: empDetail?.businessUnitNav?.name || "",
            Department: empDetail?.departmentNav?.name || "",
            Division: empDetail?.divisionNav?.name || "",
            LocationGroup: empDetail?.customString7 || "",
            CostCenter: empDetail?.costCenter || '',
            CostCenterDesc: empDetail?.costCenterNav?.description_defaultValue || "",
            CurrentLevel: (claimItem?.wfRequestNav?.results?.[0]?.totalSteps || "").toString(),
            WorkflowDateTime: Utilities.convertToDateString(claimItem?.wfRequestNav?.results?.[0]?.lastModifiedDateTime || "", 2),
            Currency: claimItem?.currency || "",
            ClaimsWorkFlowData: claimItem?.ClaimsStepNav || [],
            ItsClaims: claimResult.length > 0 ? claimResult.map(oResult => ({
                BenefitSubtype: oResult?.cust_code || oResult?.cust_Code || "",
                EducationAssistance: oResult?.cust_Education_Assistance || oResult?.cust_EducationAssistance || "",
                WageDescription: oResult?.cust_codeNav?.results?.[0]?.label_defaultValue || oResult?.cust_Code || oResult?.cust_code || "",
                BillNumber: oResult?.cust_billReceiptNumber || '',
                Description: oResult?.cust_description || oResult?.description || '',
                Amount: oResult?.cust_amount || oResult?.cust_depamount || oResult?.cust_Amount || oResult?.cust_total || oResult?.amount || claimItem?.cust_SelfAmount || claimItem?.cust_amount || oResult?.cust_VisaAmount || oResult?.cust_empvisaamount || oResult?.cust_DepAmount || '',
                WageType: oResult?.cust_Type || '',
                AcademicStartDate: Utilities.convertToDateString(oResult?.cust_acdstdate || ''),
                AcademicEndDate: Utilities.convertToDateString(oResult?.cust_acdeddate || ""),
                AgeofChild: oResult?.cust_age || "",
                NameofChild: oResult?.nameofchild || oResult?.cust_nameofchild || oResult?.cust_childname || "",
                GradeofChild: oResult?.cust_gyofchild || oResult?.cust_ChildGrade || "",
                Comments: claimItem?.description || claimItem?.cust_Comment || oResult?.cust_Comments || oResult?.cust_comments || claimItem?.remarks || "",
              
                AssignmentNumber: claimItem?.cust_RequestId || oResult?.cust_RequestId || "",
                Attachment: Buffer.from((claimItem?.attachmentNav?.fileContent || oResult?.cust_attachmentNav?.fileContent || oResult?.cust_AttachmentNav?.fileContent || ""), "base64"), 
                AttachmentType: mimeTypes[(claimItem?.attachmentNav?.fileExtension || oResult?.cust_attachmentNav?.fileExtension || oResult?.cust_AttachmentNav?.fileExtension || "")] || (claimItem?.attachmentNav?.fileExtension || oResult?.cust_attachmentNav?.fileExtension || oResult?.cust_AttachmentNav?.fileExtension || ""),
                Location: claimItem?.cust_Location || oResult?.cust_Location || "",
                SchoolName: oResult?.cust_nameofscl || "",
                TermofClaim: oResult?.cust_toclaim || "",
                DOBofChild: Utilities.convertToDateString(oResult?.cust_dateofbirth || oResult?.dateOfBirth || claimItem?.cust_dateofbirth || ""),
            })) : []
        };
        
      //  console.log(mainClaim.ClaimId, mainClaim.ItsClaims.map(obj => obj.Attachment.byteLength));
        const isClaimAvailable = HanaClaimsMap.get(mainClaim.ClaimId);

        if(isClaimAvailable){
          const UpdateQuery = UPDATE(ClaimReports).set(mainClaim).where({ClaimId: mainClaim.ClaimId});
          queries.push(UpdateQuery);
        }else{
          createData.push(mainClaim);
        }

        return mainClaim;
      }); 

      const srv = cds.services['taqa.srv.TaqaDbService'];   
      const createQuery =  srv.create(ClaimReports).entries(createData);
      if(createData.length > 0) queries.push(createQuery);

      await tx.run([...queries]);
      await tx.commit();
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }

    }
    const oURLSettings = {
      "BenefitEmployeeClaim": {
        getBaseURL: () => "/BenefitEmployeeClaim",
        getParameter: () => ({ "recordStatus": "pending" }),
        getExpand: (key = "PENDING") => {
          if (key === "PENDING") {
            return "wfRequestNav/wfRequestStepNav/positionNav,workerIdNav,cust_benGeneralESR/cust_AttachmentNav,cust_benAirticket/cust_AttachmentNav,cust_benAirticket/cust_codeNav,cust_benAirticket/cust_TypeofPassengerNav,cust_benAirticket/cust_PassengersNav,cust_benGeneralESR/cust_codeNav,cust_benClientEntertainment/cust_AttachmentNav,cust_benClientEntertainment/cust_codeNav,cust_medicalSubClaim/cust_AttachmentNav,cust_medicalSubClaim/cust_codeNav,cust_EducationMonthly/cust_AttachmentNav,cust_EducationMonthly/cust_codeNav,cust_MobileClaim/cust_codeNav,cust_MobileClaim/cust_AttachmentNav,cust_HRAClaim/cust_AttachmentNav,cust_HRAClaim/cust_codeNav,cust_BusinessTravelReimbursement/cust_codeNav,cust_BusinessTravelReimbursement/cust_attachmentNav,cust_NonSaudiCareerDevelopmentTraining/cust_attachmentNav,cust_CareerDevelopementtraining/cust_codeNav,cust_CareerDevelopementtraining/cust_attachmentNav,cust_fulltuitionassistance/cust_AttachmentNav,cust_fulltuitionassistance/cust_codeNav,cust_MembershipFees/cust_codeNav,cust_MembershipFees/cust_attachmentNav,benefitNav/legalEntities,lastModifiedByNav,benefitDependentDetail,attachmentNav,cust_Visa_Expenses/cust_codeNav,cust_Visa_Expenses/cust_attachmentNav,cust_HomeairportNav,benefitDependentDetail/relationShipTypeNav,benefitDependentDetail/cust_ChildGenderNav,benefitDependentDetail/cust_VisaTypeNav,benefitEmployeeClaimDetail,cust_Visa_TypeNav,cust_Exit_ReentryFees/cust_AttachmentNav,cust_Exit_ReentryFees/cust_codeNav,benefitNav,recordStatusNav,statusNav,wfRequestNav,wfRequestNav/empWfRequestNav,wfRequestNav/wfRequestCommentsNav,wfRequestNav/wfRequestParticipatorNav,wfRequestNav/wfRequestStepNav";
          }
          else if (key === "APPROVED") {
            return "workerIdNav,cust_benAirticket/cust_AttachmentNav,cust_benAirticket/cust_codeNav,cust_benAirticket/cust_TypeofPassengerNav,cust_benGeneralESR/cust_AttachmentNav,cust_benAirticket/cust_PassengersNav,cust_benGeneralESR/cust_codeNav,cust_benClientEntertainment/cust_AttachmentNav,cust_benClientEntertainment/cust_codeNav,cust_medicalSubClaim/cust_AttachmentNav,cust_medicalSubClaim/cust_codeNav,cust_EducationMonthly/cust_AttachmentNav,cust_EducationMonthly/cust_codeNav,cust_MobileClaim/cust_codeNav,cust_MobileClaim/cust_AttachmentNav,cust_HRAClaim/cust_codeNav,cust_HRAClaim/cust_AttachmentNav,cust_BusinessTravelReimbursement/cust_codeNav,cust_BusinessTravelReimbursement/cust_attachmentNav,cust_CareerDevelopementtraining/cust_codeNav,cust_CareerDevelopementtraining/cust_attachmentNav,cust_fulltuitionassistance/cust_AttachmentNav,cust_fulltuitionassistance/cust_codeNav,cust_MembershipFees/cust_codeNav,cust_MembershipFees/cust_attachmentNav,benefitNav/legalEntities,lastModifiedByNav,benefitDependentDetail,attachmentNav,cust_Visa_Expenses/cust_codeNav,cust_Visa_Expenses/cust_attachmentNav,cust_HomeairportNav,benefitDependentDetail/relationShipTypeNav,benefitDependentDetail/cust_ChildGenderNav,benefitDependentDetail/cust_VisaTypeNav,benefitEmployeeClaimDetail,cust_Visa_TypeNav,cust_Exit_ReentryFees/cust_AttachmentNav,cust_Exit_ReentryFees/cust_codeNav,cust_Exit_ReentryFees/cust_EmpVisatypeNav,benefitNav,recordStatusNav,statusNav";
          }
        }

      },
      "EmpJob": {
        getBaseURL: () => "/EmpJob",
        getFilter: (EmployeeIDList, key = "userId") => {
          const Filter = EmployeeIDList.map(id => `${key} eq '${id}'`).join(' or ');
          return "(" + Filter + ")";
        },
        getSelect: () => "userNav/displayName",
        getExpand: () => "userNav,departmentNav,costCenterNav,businessUnitNav,companyNav,divisionNav"
      }
    }

    const tx = cds.transaction();

    try {
      const BenefitEmployeeClaimSettings = oURLSettings["BenefitEmployeeClaim"];
      const ApprovedData = await Utilities.getSFData(`${BenefitEmployeeClaimSettings.getBaseURL()}`, "", {}, BenefitEmployeeClaimSettings.getExpand("APPROVED"), "CL-1");
      console.log("Approved Data done!");
      // const ApprovedDataMap = new Map();
      // ApprovedData.forEach(item => {
      //   ApprovedDataMap.set(item.id, item);
      // });



      const PendingData = await Utilities.getSFData(BenefitEmployeeClaimSettings.getBaseURL(), "", BenefitEmployeeClaimSettings.getParameter(), BenefitEmployeeClaimSettings.getExpand(), "CL-2");
      console.log("Pending Data done!");
      return;

 
    return;
  
    } catch (error) {
      await tx.rollback();
      req.error(error);
    }


  
    return;



});

this.on( "AccrualPosting", async (req) => { 
  const srv = cds.services['taqa.srv.TaqaDbService']; 
  const { AccrualLogs } = srv.entities;

  const createData = req.data.payload; // Expecting an array of objects
  if (!Array.isArray(createData) || createData.length === 0) {
      return req.error(400, "Invalid or empty data received.");
  }

  try {
      // Validate the structure of incoming data
      const isValid = createData.every(record =>
          record.ExternalCode !== undefined &&
          record.TimeAccountExternalCode !== undefined &&
          record.EmployeeID !== undefined // Add validation for other fields if necessary
      );

      if (!isValid) {
          return req.error(400, "Invalid data structure. Please check the fields.");
      }

      // Use the transaction from the service
      await srv.transaction(async (tx) => {
          await tx.create(AccrualLogs).entries(createData);
      });

      return "Success";
  } catch (error) {
      console.error("Error creating records:", error);
      return req.error(500, "Failed to create records. Please try again.");
  }
});
    
  this.on("GET", "UpdateAccrual", async (req, next) => {

    const Utilities = {

      convertToDateString: (dateString) => {
        // Extract the timestamp value from the string using a regular expression
        const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

        // If the match is found, convert it to a number and create a Date object
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = parseInt(timestampMatch[1], 10);
          const date = new Date(timestamp);

          // Check if the Date object is valid
          // if (isNaN(date)) {
          //   throw new Error("Invalid timestamp");
          // }

          // Format the date to yyyy-mm-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        }

        // Return an empty string if the input format is incorrect
        return '';
      },
      getsf: () => {
        const sapAxios = require('sap-cf-axios').default;
        const sf = sapAxios("SF");
        return sf;
      },

      generateDates: function (startDate, endDate, format = 1) {

        let currentDate = new Date(startDate);
        let datesArray = [];

        while (currentDate <= new Date(endDate)) {
          datesArray.push(Utilities.formatDate(currentDate, format));
          // Incrementing currentDate
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return datesArray;
      },

      constructURL: (baseURL, filter, parameters, expand = '', select = '', orderby = '') => {
        // Initialize an array to hold query string parts
        const queryParts = [];

        // Add the filter part if it's not empty or undefined
        if (filter) {
          queryParts.push(`$filter=${encodeURIComponent(filter)}`);
        }

        // Add the expand part if it's provided and not empty
        if (expand) {
          queryParts.push(`$expand=${encodeURIComponent(expand)}`);
        }

        if (select) {
          queryParts.push(`$select=${encodeURIComponent(select)}`);
        }

        if (orderby) {
          queryParts.push(`$orderby=${encodeURIComponent(orderby)}`);

        }

        // Add parameter key-value pairs if parameters are not empty
        if (parameters && Object.keys(parameters).length > 0) {
          Object.keys(parameters).forEach(key => {
            // Ensure both key and value are URL encoded
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
          });
        }

        // Construct the final query string
        const queryString = queryParts.join('&');

        // Return the full URL, adding query string only if it's not empty
        const fullURL = queryString ? `${baseURL}?${queryString}` : `${baseURL}?`;

        return fullURL;
      },


      getSFData: async (baseURL, filter, parameters, expand, select, orderby) => {
        // Construct URL with the correct expand parameter handling
        let url = Utilities.constructURL(baseURL, filter, parameters, expand, select, orderby);
        const batchSize = 1000; // Number of records to fetch per batch
        let skip = 0; // Initial value for skipping records
        let data = [];
        let sf = Utilities.getsf();

        while (true) {
          // Construct the URL with $top and $skip parameters for pagination
          let paginatedUrl = `${url}&$top=${batchSize}&$skip=${skip}`;
          try {
            const responseSF = await sf({
              method: 'GET',
              url: paginatedUrl,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            });

            const SFdata = responseSF.data.d.results;
            data = data.concat(SFdata);

            // If the number of records fetched is less than the batch size,
            // it means there are no more records to fetch, so exit the loop
            if (SFdata.length < batchSize) {
              break;
            }

            // Increment the skip value for the next batch
            skip += batchSize;

          } catch (error) {
            console.log("Error WITH API: " + error);
            console.log("Error : " + error);
            break; // Exit the loop in case of an error
          }
        }

        return data;
      },

      getBTPData: (Table, whereClause) => {
        let data = SELECT.from(Table).where(whereClause);
        return data;
      },
      
      formatDate: (date, format = 1) => {

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        if (format === 1) return `${year}-${month}-${day}`;
        else if (format === 2) return `${day}-${month}-${year}`;
        else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
        else if (format === 4) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
      },
      
      
    };
    const mapData = (record) =>  ({
      "TimeAccount_externalCode": record.TimeAccountExternalCode,
      "externalCode": record.ExternalCode,
      "bookingUnit": record.BookingUnit,
      "referenceObject": null,
      "bookingType": record.BookingType,
      "bookingDate": `/Date(${new Date(record.BookingDate).getTime()})/`,
      "employeeTime": null,
      "bookingAmount": record.BookingAmount,
      "comment": null
    })
    const postToAPIWithRetry = async (record, maxRetries = 3, sf = Utilities.getsf(), url = '/TimeAccountDetail', method = 'POST') => {
      let attempt = 0;
      const rec = mapData(record);
      while (attempt < maxRetries) {
          try {
            const response = await sf({
              method,
              url,
              data: rec,
              headers: {
                "content-type": "application/json"
              },
              xsrfHeaderName: "x-csrf-token"
            }); 
            // Handle error based on response structure (if needed)
            if (response.status >= 400) {
              throw new Error(`API Error: ${response.statusText}`);
            }
            
            // add one if condition to parse error
              console.log(`Successfully posted record: ${record.ExternalCode}`);

               // Update the status in the database as 'success'
              await UPDATE('taqa.srv.TaqaDbService.AccrualLogs')
              .set({ Status: 'success' })
              .where({ ExternalCode: record.ExternalCode, TimeAccountExternalCode: record.TimeAccountExternalCode });

              return { success: true, record, response: response.data };
          } catch (error) {
              attempt++;
              console.error(
                  `Failed to post record ${record.ExternalCode}. Attempt ${attempt} of ${maxRetries}. Error: ${error?.response?.data?.error?.message?.value}`
              );

              if(error?.response?.data?.error?.code === 'COE_RECORD_ALREADY_EXIST'){
                await UPDATE('taqa.srv.TaqaDbService.AccrualLogs')
                .set({ Status: 'COE_RECORD_ALREADY_EXIST', DELETED: true })
                .where({ ExternalCode: record.ExternalCode, TimeAccountExternalCode: record.TimeAccountExternalCode });
                return { success: false, record, error: error?.response?.data?.error?.message?.value };
              }
              // If retries are exhausted
              if (attempt === maxRetries ) {
                  return { success: false, record, error: error?.response?.data?.error?.message?.value };
              }
          }
      }
    };
  
 
  const processQueue = async (tasks, concurrency = 25) => {
    const results = [];
    const executing = new Set();

    for (const task of tasks) {
        const p = task()
            .then((result) => results.push(result))
            .catch((err) => results.push(err))
            .finally(() => executing.delete(p));

        executing.add(p);

        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }

    await Promise.all(executing);
    return results;
};
    const batchSize = 180;

    let offset = 0;

    const {AccrualLogs} = cds.entities('taqa.srv.TaqaDbService');


    while(true){

      const res = await SELECT.from(AccrualLogs)
      .where({ Status: 'error' })
      .limit(batchSize, offset);
        offset += batchSize;

        if (!res.length) {
            break;
        }

      // const red = await postToAPIWithRetry(res[0]);

      const tasks = res.map((log) => () => postToAPIWithRetry(log));
      // Process the tasks with concurrency control
      const results = await processQueue(tasks, 180);
      // post
      if(batchSize > res.length){
        break;
      }


    }

    
    console.log("");
    return "Done";
  });

  this.on("GET", "AccrualEmailNotification", async(req, next) => {
    try {

    const query = await SELECT.distinct.from('taqa.srv.TaqaDbService.TimeSheetDetails', ['EmployeeID'])
    .where({ EmployeeIs: 'Rotational' });

    const employeeIds = query.map(record => record.EmployeeID);

    // console.log(employeeIds); // Outputs a 1D list of distinct EmployeeID values

    const ampscodes = (await SELECT.from('taqa.srv.TaqaDbService.RowInfo').where({TableName: 'AMPS'})).map(oItem => oItem.Column1 ?? "");
    const timeAccountTypes = (await SELECT.from('taqa.srv.TaqaDbService.RowInfo').where({TableName: 'TimeAccount Types'})).map(oItem => ({
        ExternalCode: oItem.Column1,
        Country: oItem.Column2,
        TimeProfile: oItem.Column4,
    }));
    const approvers =  (await SELECT.from('taqa.srv.TaqaDbService.RowInfo').where({TableName: 'Approver Table'})).map(oItem => ({
      Name: oItem?.Column5 ?? "",
      Location: oItem.Column1 ?? "",
      CompanyCode: oItem.Column2 ?? "",
      Email: oItem?.Column4 ?? "",
      ID: oItem?.Column3 ?? "",
      Department: oItem?.Column6 ?? "",
      Level: oItem?.Column12 ?? "",
      ProjectCode: oItem?.Column10 ?? "",
      Division: oItem?.Column17 ?? "",
      AMPSIndicator: oItem?.Column16 ?? ""
  }));

    const processQueue = async (tasks, concurrency = 25) => {
      const results = [];
      const executing = new Set();
  
      for (const task of tasks) {
          const p = task()
              .then((result) => results.push(result))
              .catch((err) => results.push(err))
              .finally(() => executing.delete(p));
  
          executing.add(p);
  
          if (executing.size >= concurrency) {
              await Promise.race(executing);
          }
      }
  
      await Promise.all(executing);
      return results;
    };

    const getDatafromEmpJob = async (EmployeeIDs) => {
      const getFilter = (IDs, key = 'userId') => {
        const EmployeeFilter = `(${IDs.map(id => `${key} eq '${id}'`).join(' or ')})`;
        return EmployeeFilter;
      };
     
      const URL = '/EmpJob'

      const sapAxios = require('sap-cf-axios').default;
      const sf = sapAxios("SF");
      // Split EmployeeIDs into chunks of 100
        const filter = `${getFilter(EmployeeIDs)} and (emplStatusNav/picklistLabels/label eq 'Active') and (customString6 eq '627826')`;
        const expand = 'customString13Nav,userNav';
        const select = 'userId,company,userNav/displayName,customString13Nav/localeLabel,workscheduleCode,timeTypeProfileCode,department,location,division';


        const response = await sf({
          method: 'GET',
          url: URL,
          headers: {
            "content-type": "application/json"
          },
          params : {
            $filter: filter,
            $expand: expand,
            $select: select

          },
          xsrfHeaderName: "x-csrf-token"
        });

        const getDetails = (oItem, ampscodes) => {
          let balance, days;
          if(ampscodes.includes(oItem.company)){
            let [firstNumber, secondNumber] = oItem?.customString13Nav?.localeLabel?.split('/') || [undefined, undefined];
            if (firstNumber && secondNumber) {
                balance = (parseInt(secondNumber) / parseInt(firstNumber));
                days = firstNumber;
            } 
          }
          else{
            const input = oItem?.workscheduleCode ?? "";
            let num1 = '';
                let num2 = '';
                let i = 0;



                // Extract the first number
                while (i < input.length && !isNaN(input[i]) && input[i] !== ' ') {
                    num1 += input[i];
                    i++;
                }

                // Skip non-numeric characters until the 'x' character is found
                while (i < input.length && input[i].toLowerCase() !== 'x') {
                    i++;
                }

                // Move past the 'x' character
                i++;

                // Extract the second number
                while (i < input.length && !isNaN(input[i]) && input[i] !== ' ') {
                    num2 += input[i];
                    i++;
                }

                if (num1 && num2 && num1 !== 0) {
                    balance = (num2 / num1);
                    days = num2 * 7;
                }
          }

          if(days && balance){
              return {perDay: balance, maxValue: (days * balance)};
          }
          else{
              return {perDay: balance, maxValue: 1000000};
          }
        }
        const results = (response.data.d.results).map(oItem => ({ 
            EmployeeID: oItem.userId ?? "",
            EmployeeName: oItem.userNav?.displayName ?? "",
            CompanyCode: oItem.company ?? "",
            Department: oItem?.department ?? "",
            Division: oItem?.division ?? "",
            Location: oItem?.location ?? "",
            isAmps : ampscodes.includes(oItem?.company),
            TimeProfile: oItem?.timeTypeProfileCode ?? "",
            ...getDetails(oItem, ampscodes)
          
        }));

        return results;

        

      
    }

    const filterApproverData = (Employee, level, projectCodeFilter, includeEmptyProjectCode = true) => {
      const {isAmps} = Employee
      return approvers.filter(({ Location, CompanyCode, Level, ProjectCode, Department, Division }) => {
          const locationMatch = Location === Employee.Location;
          const companyMatch = CompanyCode === Employee.CompanyCode;
          const departmentMatch = Department === Employee.Department;
          const divisionMatch = Division === Employee.Division;
          const projectMatch = ProjectCode === projectCodeFilter || (includeEmptyProjectCode && ProjectCode === "");

          if (isAmps) {
              if (Level === "L1") {
                  return Level === level && companyMatch && locationMatch && departmentMatch;
              } else {
                  return Level === level && companyMatch && projectMatch;
              }

          } else {
              return Level === level && departmentMatch && projectMatch && divisionMatch && companyMatch;
          }
      });
  };
    const validateBalance = async (Employee, timeAccountTypes) => {
      const {EmployeeID, isAmps, TimeProfile, maxValue, perDay} = Employee;
      const acountType = timeAccountTypes.find(obj => obj.TimeProfile === TimeProfile)?.ExternalCode;
      const userIdFilter = `(userId eq '${EmployeeID}')`
      const timeaccountfilter = `(timeAccountType eq '${isAmps && acountType  ? acountType : 'ROT_TA_KSA'}')`;
      const filter = `${userIdFilter} and ${timeaccountfilter}`
      const sapAxios = require('sap-cf-axios').default;
      const sf = sapAxios("SF");
      const response = await sf({
        method: 'GET',
        url: "EmpTimeAccountBalance",
        headers: {
          "content-type": "application/json"
        },
        params : {
          $filter: filter,

        },
        xsrfHeaderName: "x-csrf-token"
      });

      const balance = parseFloat(response?.data?.d?.results[0]?.balance || 0);

      const result = await SELECT.one
      .columns('ProjectCode')
      .from('taqa.srv.TaqaDbService.TimeSheetDetails')
      .where({
          EmployeeID: EmployeeID,
          Status: 'Approved',
          LeaveCode: ''
      })
      .orderBy({ Date: 'desc' }); // Order by Date descending to get the latest approved record

      if(result && balance > maxValue) {
        let emailpayload = [];
        const limitExceeding  = balance - maxValue;
        const daysExceeding  = limitExceeding/perDay; 
        if(daysExceeding >= 15){
          const L3 = filterApproverData(Employee, "L3", result.ProjectCode);
          emailpayload.push(...L3);
        }else if(daysExceeding >= 10){
          const L2 = filterApproverData(Employee, "L2", result.ProjectCode);
          emailpayload.push(...L2);

        }else if(daysExceeding >= 5){
          const L1 = filterApproverData(Employee, "L1", result.ProjectCode);
          emailpayload.push(...L1);
        }
        // const L1 = filterApproverData(Employee, "L1", result.ProjectCode);
        // emailpayload.push(...L1);

        // add hashmap
         emailpayload.forEach(item => {
          const info = MailMap.get(item.ID);
          if(info){
            MailMap.set(info.ID, {
              ...info,
              EmployeeIDs: [...info.EmployeeIDs, EmployeeID]
            })
          }else{
           
            MailMap.set(item.ID, {
              ...item,
              EmployeeIDs: [EmployeeID]
            })
          }
         } )
        return {...result, ...Employee, mails: emailpayload}
      };
      return null;
    
      
    }

    const processdata = (batch) => {

    }
    const BATCH_SIZE = 100;
    const results = [];

    const MailMap = new Map();
    for (let i = 0; i < employeeIds.length; i += BATCH_SIZE) {
      const batch = employeeIds.slice(i, i + BATCH_SIZE);

      const employeeData = await getDatafromEmpJob(batch);
      const dat = employeeData.map((obj) => () => validateBalance(obj, timeAccountTypes))

      const res = (await processQueue(dat, 20)).filter(obj => obj != null);
      console.log("hi");
      
     


    }
      const workflow = await cds.connect.to('TAQA_BPA_CPI');
    console.log("connected to workflow");
    for (const email of MailMap.values()) {
      console.table(email);
      const payload = {
        "definitionId": "leaveaccrualtaqanotification.leaveaccrualnotification", //"eu10.taqa-dev-fiori.employeeemail.employeeEmailNotiication",
        "context": {
          "EmailID": email.Email,
          "aprroverName": email.Name ?? "",
          "EmployeeList": email.EmployeeIDs.join(", "),
          
        }
      }
      const results = await workflow.tx(req).post('/workflow-instances', payload);
    }
    } catch (error) {
      console.error(error);
      return req.error(error);
    }
    
  })

  const formatDate = (date, format = 1) => {

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    if (format === 1) return `${year}-${month}-${day}`;
    else if (format === 2) return `${day}-${month}-${year}`;
    else if (format === 3) return `${year.padStart(2, '0')}${month}${day}`;
    else if (format === 4) return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    else throw new Error("Invalid format specified. Use 1 for 'yy-mm-dd', 2 for 'dd-mm-yy', 3 for yymmdd.");
  }

  const constructURL = (baseURL, filter, parameters, expand = '', select = '', orderby = '') => {
    // Initialize an array to hold query string parts
    const queryParts = [];

    // Add the filter part if it's not empty or undefined
    if (filter) {
      queryParts.push(`$filter=${encodeURIComponent(filter)}`);
    }

    // Add the expand part if it's provided and not empty
    if (expand) {
      queryParts.push(`$expand=${encodeURIComponent(expand)}`);
    }

    if (select) {
      queryParts.push(`$select=${encodeURIComponent(select)}`);
    }

    if (orderby) {
      queryParts.push(`$orderby=${encodeURIComponent(orderby)}`);

    }

    // Add parameter key-value pairs if parameters are not empty
    if (parameters && Object.keys(parameters).length > 0) {
      Object.keys(parameters).forEach(key => {
        // Ensure both key and value are URL encoded
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
      });
    }

    // Construct the final query string
    const queryString = queryParts.join('&');

    // Return the full URL, adding query string only if it's not empty
    const fullURL = queryString ? `${baseURL}?${queryString}` : `${baseURL}?`;

    return fullURL;
  }

  const getsf = () => {
    const sapAxios = require('sap-cf-axios').default;
    const sf = sapAxios("SF");
    return sf;
  }

  const getSFData = async (baseURL, filter, parameters, expand, select, orderby) => {
    // Construct URL with the correct expand parameter handling
    let url = constructURL(baseURL, filter, parameters, expand, select, orderby);
    const batchSize = 1000; // Number of records to fetch per batch
    let skip = 0; // Initial value for skipping records
    let data = [];
    let sf = getsf();

    while (true) {
      // Construct the URL with $top and $skip parameters for pagination
      let paginatedUrl = `${url}&$top=${batchSize}&$skip=${skip}`;
      try {
        const responseSF = await sf({
          method: 'GET',
          url: paginatedUrl,
          headers: {
            "content-type": "application/json"
          },
          xsrfHeaderName: "x-csrf-token"
        });

        const SFdata = responseSF.data.d.results;
        data = data.concat(SFdata);

        // If the number of records fetched is less than the batch size,
        // it means there are no more records to fetch, so exit the loop
        if (SFdata.length < batchSize) {
          break;
        }

        // Increment the skip value for the next batch
        skip += batchSize;

      } catch (error) {
        console.log("Error WITH API: " + error);
        console.log("Error : " + error);
        break; // Exit the loop in case of an error
      }
    }

    return data;
  }

  this.on("GET", "OpenRecordCreation", async(req, next) => {

   const countDaysBetweenDates = function (startDate, endDate) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  };

  const generateDaysBetweenDates =  function (startDate, endDate, header, itemsData, absenceList) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const dates = [];

    while (start <= end) {
      if(itemsData.includes(formatDate(start))){
        start.setDate(start.getDate() + 1);
        continue;
      }
      let absenceStr = "";
      let leaveCode = "";
      let statusStr = "Open";
      let dateStr = formatDate(start);
      absenceList.forEach(oItem => {
        if(oItem.startDate <= dateStr && oItem.endDate >= dateStr){
          absenceStr = oItem.abName;
          leaveCode = oItem.externalCode;
          statusStr = "Approved";
        }
      });
     let itemsObj = {
      Date: formatDate(start),
      EmployeeID: header.EmployeeID,
      AppID: "EMPTIM",
      CostCenter: header.CostCenter,
      InternalOrder: header.InternalOrder,
      WbsCode: header.WbsCode,
      EmployeeName: header.EmployeeName,
      Division: header.Division,
      DivisionDesc: header.DivisionDesc,
      Department: header.Department,
      DepartmentDesc: header.DepartmentDesc,
      Location: header.Location,
      LocationDesc: header.LocationDesc,
      CompanyCode: header.CompanyCode,
      CompanyCodeDesc: header.CompanyCodeDesc,
      ProjectDesc: header.ProjectDesc,
      ProjectCode: header.ProjectCode,
      EmpEmailID: header.EmpEmailID,
      EmpUserEmail: header.EmpUserEmail,
      JobTitle: header.JobTitle,
      StartDate: header.StartDate,
      EndDate: header.EndDate,
      EmployeeIs: header.EmployeeIs,
      Absence: absenceStr,
      LeaveCode: leaveCode,
      Status: statusStr
     }   
      dates.push(itemsObj);

      start.setDate(start.getDate() + 1);   // Increment the date by 1 day
    }

    return dates;
};
  

    const {TimeSheetDetails, RowInfo} = cds.entities('taqa.srv.TaqaDbService');
    let srv = cds.services['taqa.srv.TaqaDbService'];
    const sapAxios = require('sap-cf-axios').default;
    const sf = sapAxios("SF");
    const BATCH_SIZE = 100;
   // 'taqa.srv.TaqaDbService.TimeSheetDetails'

  let today = formatDate(new Date());
  let datesQuery = `SELECT COLUMN1, COLUMN2 FROM  "TAQA"."TAQA_DB_ROWINFO" WHERE TABLENAME = 'CutOffCycles' AND COLUMN1 <= '${today}' AND COLUMN2 >= '${today}' AND DELETED = false`;
  let dates = await db.run(datesQuery);
  dates = dates[0];
  const appIDs = ['PROALO', 'PROALONOR'];
    let employeeIds = await SELECT.from(TimeSheetDetails)
    // .columns(['EmployeeID','StartDate','EndDate','ProjectCode'])  // Select specific columns
    .where({ AppID: { in: appIDs} }); // WHERE clause

    // employeeIds = employeeIds.filter(oItem => oItem.EmployeeID === "10005" || oItem.EmployeeID === "10004");


    for (let i = 0; i < employeeIds.length; i += BATCH_SIZE) {
      const batchEmployees = employeeIds.slice(i, i + BATCH_SIZE);
      // let empList = batchEmployees.map(oItem => oItem.EmployeeID);
      let stDate = dates.COLUMN1;
      let edDate = dates.COLUMN2;
      // stDate = "2024-08-01";
      let dateTemp = new Date(stDate);
      dateTemp.setDate(dateTemp.getDate() - 90);
      stDate = formatDate(dateTemp);
      let whereCondition = `AppID = 'EMPTIM' AND Date BETWEEN '${stDate}' AND '${edDate}'`;

      const employeeIds1 = batchEmployees.map(oItem => `'${oItem.EmployeeID}'`).join(', ');

      whereCondition += ` AND EmployeeID IN (${employeeIds1})`;

      const emptimData = await SELECT.from(TimeSheetDetails)
          .where(whereCondition);
     
        for (const oItem of batchEmployees) {
          // let str = "EmployeeID = '" + oItem.EmployeeID + "' AND AppID = 'EMPTIM'";
          let st = oItem.StartDate;
          let ed = oItem.EndDate;
          if(st > stDate){
            st = stDate;
          }
          if(ed > dates.COLUMN2){
            ed = dates.COLUMN2;
          }
          let emptimDataFiltered = emptimData.filter(itemFil => itemFil.EmployeeID === oItem.EmployeeID && itemFil.ProjectCode === oItem.ProjectCode && (itemFil.Date >= st && itemFil.Date <= ed));
          let filteredCount = emptimDataFiltered.length;
          let filteredDates = emptimDataFiltered.map(itemFil => itemFil.Date);
          let daysBT = countDaysBetweenDates(st, ed);
          if(filteredCount < daysBT){
            const filter = `(userId eq ${oItem.EmployeeID}) and (approvalStatus eq 'APPROVED' or approvalStatus eq 'PENDING')`;
            let base = `/EmployeeTime`;
            let absenceData = await getSFData(base, filter, {}, "timeTypeNav");
            let absenceList = [];
            absenceData.forEach((abList) => {
              if (abList.timeTypeNav.category === "ABSENCE") {
                const timestampSt = parseInt(abList.startDate.match(/\d+/)[0], 10);
                const timestampEd = parseInt(abList.endDate.match(/\d+/)[0], 10);
                let tempSTab = {
                  startDate: formatDate(new Date(timestampSt)),
                  endDate: formatDate(new Date(timestampEd)),
                  externalCode: abList.timeType,
                  abName: abList.timeTypeNav.externalName_defaultValue,
                }
                absenceList.push(tempSTab);
              }
            });
            // absenceData = absenceData.filter(abItem => abItem.timeTypeNav.category === "ABSENCE");
            let generatedData = generateDaysBetweenDates(st, ed, oItem, filteredDates, absenceList);
            let result = await srv.create(TimeSheetDetails).entries(generatedData);
            // let temp
          }
          // let temp
        }        
      



      // const whereclause = getWhereClause("PROALO", "", "", empList)
      // const emptimData = await SELECT.from(TimeSheetDetails).where(whereclause)
    }
    return "Open Records Created Successful"

  });

  


});