/**
 * sequence generation for IDs is frowned upon as it degrades performance on a large scale. 
 * Our insertion frequency is less, and to continue the legacy way of ID generation ,we use this
 * Author : Sreehari Pillai
 */
const fs = require('fs');
class SequenceUtil {
    constructor(db, srv, path) {
        this._db = db;
        this._srv = srv;
        var _path = path;
        let configRaw = fs.readFileSync(_path);
        this._config = JSON.parse(configRaw);
    }
    async validate() {
        //read the list of sequences available .
        try{
            var availableSequences = await this._db.run("select SCHEMA_NAME , SEQUENCE_NAME from SYS.SEQUENCES where SEQUENCE_NAME like 'MGC%' ");
        }
        catch(Err){
            // non RDMBS fallback here
            var availableSequences = [];
            return;
        }
        
        this._config.forEach((c)=>{
            if(! availableSequences.find((as) => {
                return as.SEQUENCE_NAME == c.sequence
            })){
                console.log("MGC:Sequence : " + c.sequence + "("  +c.entity + ") not found");
            }
        });
    }
    getConfig(path) {
        let split = path.split('.');
        let serviceName = split[split.length - 2];
        let entityName = split[split.length - 1];
        console.log("MGC:getConfig:" + serviceName + "." + entityName);
        return this._config.find((f) => {
            return f.entity == entityName
        });
    }
    getEntity(path) {
        let split = path.split('.');
        let serviceName = split[split.length - 2];
        let entityName = split[split.length - 1];
        return entityName;
    }
    async getNext(path) {

        console.log("Looking for path:" + path);
        let cObject = this.getConfig(path);
        //build sequnce query
        let entity = this.getEntity(path);
        var originalEntityInFull = '';
        try {
            originalEntityInFull = this._srv.entities[entity].projection.from.ref[0];
        }
        catch (E) {
            //doomsday 
            //ok. , until we change sequence util logic to adapt to CDS entity based sequence.
        }

        // eg : 'atom.db.mdm.gen.LineOfBusiness' . 
        /**
         * If an entity is exposed via multiple services , we must mention the sequence name against all these services 
         * in EntitySeqeunceMapping.json
         * If you want to make it generic , then use , "originalEntityInFull" variable , which refers to the original CDS entity exposed, and make use of it..
         */

        let q = 'SELECT "' + cObject.sequence + '".NEXTVAL as ID from DUMMY';
        let data = await this._db.run(q);
        return data[0].ID;

    }
}

module.exports = SequenceUtil;