<template>
  <div class="file-item" href="#">
    <div class="file-item-name">
      <a :href="url">{{filename}}</a>
    </div>
    <div class="file-item-details">
    <span class="file-item-size">Size: {{parsedSize}}</span>
    &nbsp;
    <span class="file-item-size" v-if="owner">Owner: {{owner}}</span>
    </div>
    <div class="file-item-buttons">
    <span class="file-item-button" v-if="status">
      {{statusIcon}}
    </span>
    <button @click="emitDelete" class="file-item-button" v-show="canDelete">X</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileItem',
  emits:[
    "delete"
  ],
  props: {
    filename: String,
    // File size in bytes
    size: Number,
    // File location
    url: String,
    // Original uploader
    owner: String,
    // Status used exclusively by upload modal
    status:{
      required:false,
      type: String,
      validator(v){
        return ["not-started", "in-progress", "completed"].includes(v);
      }
    },
    progress:{
      required:false,
      type: Number,
    }
  },
  methods:
  {
    emitDelete()
    {
      this.$emit("delete");
    }
  },
  computed:
  {
    canDelete(){
      return !this.status || this.status === "not-started";
    },
    statusIcon(){
      if(this.status === "not-started")
        return "";
      else if(this.status === "in-progress")
        // Display with 1 decimal place if not 0 or 100
        return this.progress.toFixed((this.progress>0 && this.progress<100)?1:0)+"%";
      else
        return "done";
    },
    parsedSize()
    {
      const steps = ["bytes","KiB", "MiB", "GiB", "TiB", "PiB"];

      let size = this.size;
      let step=0;
      for(step=0;step<steps.length;step++)
      {
        if(size>=1024)
          size/=1024;
        else
          break;
      }
      return (parseFloat(size.toFixed(2)))+" "+steps[step];
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.file-item
{
  display:block;
  background-color:var(--card-color);
  color:var(--fg-color);
  margin:0;
  padding:.25rem;
  box-shadow: 4px 4px 4px var(--card-shadow-color);
  border-radius: 10px;
  user-select:none;
  text-align:left;
  position: relative;
  color:inherit;
  text-decoration:none;
  overflow:hidden;
}
.file-item-name{
  font-weight:bold;
  max-width:80%;
  overflow:hidden;
  text-overflow:ellipsis;
  a{color:inherit;}
}
.file-item-buttons
{
  position: absolute;
  top:4px;
  right:4px;
  background-color:inherit;
  .file-item-button
  {
    background-color:inherit;
    border:none;
    color: var(--secondary-fg-color);
    cursor:pointer;
    &:hover{
      font-weight:bold;
      color: var(--fg-color);
    }
  }
}

</style>
