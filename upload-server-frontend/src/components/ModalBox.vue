<template>
    <div class="modal" v-if="visible">
        <div class="modal-backdrop"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <div class="modal-title">{{title}}</div>
                <button @click="hide" class="modal-close-button">x</button>
            </div>
            <div class="modal-body">
                <slot name="body"/>
            </div>
            <div class="modal-footer">
                <slot name="footer"/>
            </div>
        </div>
    </div>
</template>

<script>
    export default{
        name: "ModalBox",
        data(){
            return{
                visible:false
            }
        },
        methods:{
            show(){
                this.visible = true;
            },
            hide(){
                this.visible = false;
            }
        },
        props:{
            title: String
        }
    }
</script>

<style lang="scss" scoped>
.modal{
    position:fixed;
    width:100%;
    height:100%;
    top:0;
    left:0;
    margin:0;
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:100;
    .modal-header{
       font-size:1.5rem;
       border-bottom: 1px solid rgba(0,0,0,0.25);
       width:100%;
       margin:0;
       position:relative;
       
       .modal-title{
           display:inline-block;
       }
       .modal-close-button{
            display:inline-block;
            top:-.25rem;
            right:0;
            position:absolute;
            background-color:transparent;
            color:var(--secondary-fg-color);
            border:none;
            cursor:pointer;
            font-size:1.5rem;
            text-align:center;
            &:hover{
                font-weight:bold;
                color: var(--fg-color);
            }
       }
    }
    .modal-backdrop
    {
        width:100%;
        height:100%;
        background-color: rgba(0,0,0,.2);
        position:fixed;
    }
    .modal-dialog{
        display:flex;
        flex-direction:column;
        background-color:var(--card-color);
        border-radius:9px;
        box-shadow: 4px 4px 4px var(--card-shadow-color);
        margin:auto;
        height:99%;
        width:99%;
        z-index:200;
        .modal-footer{
            display:flex;
            align-content:center;
            margin:0;
            margin-top:auto;
            margin-right:.25rem;
            margin-bottom:.25rem;
            align-self:flex-end;
            justify-content:space-between;
            width:auto;
            
            :nth-child(odd){
                margin-right:.25rem;
            }
        }
    }
    @media (min-width:800px)
    {
        .modal-dialog{
            width:auto;
            min-width:10rem;
            height:auto;
        }
    }
}
</style>
