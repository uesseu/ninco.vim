import { Denops } from "https://deno.land/x/denops_std@v1.0.0/mod.ts";
import { execute, call } from "https://deno.land/x/denops_std@v1.0.0/helper/mod.ts";

let key = ""
let globalModel = "gpt-3.5-turbo"
let url = "https://api.openai.com/v1/chat/completions"
//let url = "http://127.0.0.1:8000/v1/chat/completions"
//let url = ''

/**
 * A manager of order for chatGPT.
 * It can make JSON string to send to openai.
 */
class Order{
  body
  messages: Array<object>
  system: Array<object>
  single: boolean
  command: string
  command_arg: Array<string>
  name: string
  print: boolean
  model: string
  url: string
  key: string

  /**
   * Setup order object to make JSON to send to openai.
   * @param {string} model - Name of model. (Ex. "gpt-3.5-turbo")
   */
  constructor(model: string = globalModel){
    this.messages = []
    this.system = []
    this.body = {
      model: model,
      messages: [],
      stream: true,
    }
    this.single = true
    this.print = true
    this.command = ''
    this.name = ''
    this.model = ''
    this.url = 'https://api.openai.com/v1/chat/completions'
    this.key = 'gpt-3.5-turbo'
    this.command_arg = []
  }

  /**
   * Set parameter from json.
   * @param {object} param - Content of parameter.
   */
  put_parameter(param: Order){
    this.single = param.single          
    this.print = param.print          
    this.command = param.command          
    this.name = param.name          
    this.model = param.model          
    this.url = param.url          
    this.key = param.key          
    this.command_arg = param.command_arg          
  }

  /**
   * Put system parameter to the last of message.
   * @param {string} content - Content of message.
   * @returns {null} - It returns null.
   */
  putSystem(content: string){
    this.system.push({role: "system", content: content})
  }

  /**
   * Put user parameter to the last of message.
   * @param {string} content - Content of message.
   * @returns {null} - It returns null.
   */
  putUser(content: string){
    this.messages.push({role: "user", content: content})
  }

  /**
   * Put assistant parameter to the last of message.
   * @param {string} content - Content of message.
   * @returns {null} - It returns null.
   */
  putAssistant(content: string){
    this.messages.push({role: "assistant", content: content})
  }

  /**
   * Unshift user parameter to the last of message.
   * It is needed when you want to compress the chat data.
   * @param {string} content - Content of message.
   * @returns {null} - It returns null.
   */
  unshiftHistory(content: string){
    this.messages.unshift({role: "user", content: content})
  }

  /**
   * Remove old messages except system.
   * @param {number} num - Number of messages to remain.
   * @returns {null} - It returns null.
   */
  removeOld(num){
    const result: string = JSON.stringify(
      this.messages.slice(this.messages.length - num, this.messages.length)
    )
    const del_num = this.messages.length - num
    for (let n = 0; n < del_num; n++) this.messages.shift()
    return result
  }

  /**
   * Send order to openai and receive fetche object.
   * @returns {null} - JSON string for openai.
   */
  getLetter(){
    this.body['messages'] = this.system.concat(this.messages)
    return fetch(url, {
      method: "POST",
      headers: {
	"Content-Type": "application/json",
	"Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(this.body)
    });
  }

  /**
   * Reset messages.
   * @returns {null}
   */
  reset(){
    this.messages = []
  }

  /**
   * Reset system.
   * @returns {null}
   */
  resetSystem(){
    this.system = []
  }
}

/**
 * Put string with new lines to vim window by denops.
 * @param {Denops} denops - Denops object.
 * @param {string} text - String to write.
 * @returns {null} - It returns null.
 */
function putString(denops: Denops, text: string){
  let num = 0
  denops.eval("g:ninco#winid").then(x => {
    if (x == '-1'){
      text.split("\n").map(d =>{
        if(num !== 0) execute(denops, `norm o`)
        d = d.replaceAll(' ', '\\ ') + ';'
        execute(denops, 'NinPutWindowDeno '+ d)
        num++
      })
    }
    else{
      text.split("\n").map(d =>{
        if(num !== 0) execute(denops, `call win_execute(g:ninco#winid, 'norm o')`)
        d = d.replaceAll(' ', '\\ ') + ';'
        execute(denops, 'NinPutWindowDeno '+ d)
        num++
      })
    }
  })
}

/**
 * Receive reply from chatgpt and put it to vim window by denops.
 * @param {Denops} denops - Denops object.
 * @param {Order} order - Order object to use.
 * @param {bool} bool - If it is true, it put string to vim.
 * @returns {null} - All output of chatGPT.
 */
async function chatgpt2(
  denops: Denops, order: Order
){
  let resp = await order.getLetter()
  let allData = ""
  let process = null
  let writer = null
  if (order.command !== ""){
    process = new Deno.Command(order.command, {
      args: order.args,
      stdin: "piped",
    }).spawn();
    writer = process.stdin.getWriter();
  }

  for await (const chunk of resp.body){
    const data = new TextDecoder().decode(chunk)
      .split("\n\n")
      .map(x => {
	if (x.trim()[0] === "{"){
	  try {
	    return Array(JSON.parse(x.trim().slice(5))).filter(x => x !== "")
	      .map(x => x["choices"][0]["delta"]["content"]).join("")
	  } catch (er) {
	    try{
	      return JSON.parse(x)["error"]["message"]
	    }
	    catch {
	      console.log(er)
	    }
	  }
	}
    if (x.length === 0) return ""
    if (x.trim() === "data: [DONE]") return ""
    if (x.trim().slice(5, 10) === "error") {
	  try{
	    return JSON.parse(x)["error"]["message"]
	  } catch (er) {
	    console.log(er)
	  }
	}
    if (x.trim().slice(0, 8) === ": ping -") return ""
    if (x[0] !== "[") {
	  try {
	    return Array(JSON.parse(x.trim().slice(5))).filter(x => x !== "")
	      .map(x => x["choices"][0]["delta"]["content"]).join("")
	  } catch (er) {
	    return "[Error]"
	  }
        }
      })
    if (order.print) putString(denops, data.join(""))
    if (order.command !== "")
      writer.write(new TextEncoder().encode(data.join('')))
    allData += data.join("")
  }
  if (order.command !== ""){
    writer.releaseLock();
    await process.stdin.close();
  }
  return allData
}

/**
 * Receive reply from chatgpt and put it to vim window by denops.
 * @param {Denops} denops - Denops object.
 * @param {Order} order - Order object to use.
 * @param {bool} bool - If it is true, it put string to vim.
 * @returns {null} - All output of chatGPT.
 */
async function chatgpt(denops: Denops, order: Order, print: bool = true,
                      command="", args=[]){
  let resp = await order.getLetter()
  let allData = ""
  let process = null
  let writer = null
  if (command !== ""){
    process = new Deno.Command(command, {
      args: args,
      stdin: "piped",
    }).spawn();
    writer = process.stdin.getWriter();
  }

  for await (const chunk of resp.body){
    const data = new TextDecoder().decode(chunk)
      .split("\n\n")
      .map(x => {
	if (x.trim()[0] === "{"){
	  try {
	    return Array(JSON.parse(x.trim().slice(5))).filter(x => x !== "")
	      .map(x => x["choices"][0]["delta"]["content"]).join("")
	  } catch (er) {
	    try{
	      return JSON.parse(x)["error"]["message"]
	    }
	    catch {
	      console.log(er)
	    }
	  }
	}
    if (x.length === 0) return ""
    if (x.trim() === "data: [DONE]") return ""
    if (x.trim().slice(5, 10) === "error") {
	  try{
	    return JSON.parse(x)["error"]["message"]
	  } catch (er) {
	    console.log(er)
	  }
	}
    if (x.trim().slice(0, 8) === ": ping -") return ""
    if (x[0] !== "[") {
	  try {
	    return Array(JSON.parse(x.trim().slice(5))).filter(x => x !== "")
	      .map(x => x["choices"][0]["delta"]["content"]).join("")
	  } catch (er) {
	    return "[Error]"
	  }
        }
      })
    if (print) putString(denops, data.join(""))
    if (command !== "") writer.write(new TextEncoder().encode(data.join('')))
    allData += data.join("")
  }
  if (command !== ""){
    writer.releaseLock();
    await process.stdin.close();
  }
  return allData
}

/* Global object to talk with chatGPT. */
let globalOrder = new Order()
let globalOrders = Array()

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {

    async init(apikey: string, model: string, base_url: string): Promise<void> {
      key = apikey
      globalModel = model
      url = base_url
    },

    async order(order){
      if(!order.name in globalOrders) globalOrders[name] = new Order()
      let letter = globalOrders[order.name]
      letter.setConfig(order)
      chatgpt2(denops, letter)
        .then(x => letter.putAssistant(x))
    },

    async single(order, command='', args=[]): Promise<void> {
      let letter = new Order()
      letter.putUser(order)
      chatgpt(denops, letter, true, command, args)
    },

    async put(order, command='', args=[]): Promise<void>{
      globalOrder.putUser(order)
      chatgpt(denops, globalOrder, true, command, args=[])
        .then(x => globalOrder.putAssistant(x))
    },

    async compress(order): Promise<void>{
      putString(denops, "# Compress[" + order + "]")
      execute(denops, `call NincoPutEnter()`)
      const history: object = {"role": "user",
		   "content": order + globalOrder.removeOld(order)}
      chatgpt(denops, globalOrder, false).then(x => globalOrder.unshiftHistory(x))
    },

    async reset(): Promise<void>{
      globalOrder.reset()
    },

    async resetSystem(): Promise<void>{
      globalOrder.resetSystem()
    },

    async putSystem(order: string): Promise<void>{
      globalOrder.putSystem(order)
    },

    async printLog(): Promise<void>{
      console.log(globalOrder.messages)
    }

  };
};
