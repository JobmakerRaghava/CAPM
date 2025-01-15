namespace taqa.util.aspects;


aspect common{
    
        // ACTIVE : Boolean enum {
        //     Active = true ;
        //     Inactive = false ;
        // } default true;

         DELETED : Boolean enum {
             Yes = true ;
             No = false ;
         }  default false;
}