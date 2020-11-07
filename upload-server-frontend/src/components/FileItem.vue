<template>
  <div class="file-item" href="#">
    <div class="file-item-name"><a :href="url">{{filename}}</a></div>
    <div class="file-item-size">{{parseSize(size)}}</div>
    <button @click="emitDelete" class="file-item-delete">X</button>
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
    size: Number,
    url: String
  },
  methods:
  {
    emitDelete()
    {
      this.$emit("delete");
    },
    parseSize(bytes)
    {
      const steps = ["bytes","KiB", "MiB", "GiB", "TiB", "PiB"];

      let size = bytes;
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
  background-color:white;
  margin:0;
  padding:.25rem;
  box-shadow: 4px 4px 4px grey;
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
}
.file-item-delete
{
  position: absolute;
  top:4px;
  right:4px;
  background-color:inherit;
  border:none;
  cursor:pointer;
}
.file-item-delete:hover
{
  font-weight:bold;
}

</style>
