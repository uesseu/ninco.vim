import { Denops } from "https://deno.land/x/denops_std@v1.0.0/mod.ts";
import { execute } from "https://deno.land/x/denops_std@v1.0.0/helper/mod.ts";

let key = ""
let globalModel = "gpt-3.5-turbo"
/**
 * A manager of order for chatGPT.
 * It can make JSON string to send to openai.
 */
class Order{
  body
  messages: Array<object>
  system: Array<object>

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
	stream: true
      }
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
  putHistory(content: string){
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
    return fetch("https://api.openai.com/v1/chat/completions", {
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
	execute(denops, `call NinPutWindow("${d.replace(`\"`, `\\"`)}")`)
	num++
      })
    }
    else{
      text.split("\n").map(d =>{
	if(num !== 0) execute(denops, `call win_execute(g:ninco#winid, 'norm o')`)
	execute(denops, `call NinPutWindow("${d.replace(`\"`, `\\"`)}")`)
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
async function chatgpt(denops: Denops, order: Order, print: bool = true){
  let resp = await order.getLetter()
  let allData = ""
  for await (const chunk of resp.body){
    const data = new TextDecoder().decode(chunk)
      .split("\n\n")
      .map(x => {
        if (x.length === 0) return ""
        if (x.trim() === "data: [DONE]") return ""
        if (x[0] !== "[") {
	  return Array(JSON.parse(x.trim().slice(5))).filter(x => x !== "")
            .map(x => x["choices"][0]["delta"]["content"]).join("")
        }
      })
      if (print) putString(denops, data.join(""))
    allData += data.join("")
  }
  return allData
}

/* Global object to talk with chatGPT. */
let globalOrder = new Order()

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {

    async init(apikey: string, model: string): Promise<void> {
      key = apikey
      globalModel = model
    },

    async setModel(model: string): Promise<void>{
      globalModel = model
    },

    async single(order, title = ''): Promise<void> {
      let letter = new Order()
      letter.putUser(order)
      chatgpt(denops, letter)
        .then(x => execute(denops, `call NincoPutEnter()`))
    },

    async put(order, title = ''): Promise<void>{
      globalOrder.putUser(order)
      chatgpt(denops, globalOrder)
        .then(x => globalOrder.putAssistant(x))
        .then(x => execute(denops, `call NincoPutEnter()`))
    },

    async compress(num, order): Promise<void>{
      putString(denops, "# Compress[" + order + "]")
      execute(denops, `call NincoPutEnter()`)
      const history: object = {"role": "user",
		   "content": order + globalOrder.removeOld(order)}
      chatgpt(denops, globalOrder, false).then(x => globalOrder.putHistory(x))
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

  };
};
