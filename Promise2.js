class myPromise{
    constructor(func){
        this._status = 'pending'
        this._value = undefined  // 用来保存上一个的返回值
        this.resolveLists = [] // 成功回调列表
        this.rejectLists = []  // 失败回调列表
        let _resovle  = (val)=>{  // 一定要用箭头函数 不然找不到this
            const run = ()=>{
                if(this._status !== 'pending') return false
                this._status = 'fulfilled'
                this._value = val
                // 这里之所以使用一个队列来储存回调,是为了实现规范要求的 "then 方法可以被同一个 promise 调用多次"
                // 如果使用一个变量而非队列来储存回调,那么即使多次p1.then()也只会执行一次回调
                while(this.resolveLists.length){
                    let callback = this.resolveLists.shift()
                    callback(val)
                }
            }
            setTimeout(run)

        }
        let _reject = (val)=>{
            const run = ()=>{
                if(this._status !== 'pending') return false
                this._status = 'rejected'
                this._value = val
                while(this.rejectLists.length){
                    let callback = this.rejectLists.shift()
                    callback(val)
                }
            }
            setTimeout(run)
        }
        func(_resovle,_reject)
    }
    then(resFunc,rejectFunc){
        // 根据规范，如果then的参数不是function，则我们需要忽略它, 让链式调用继续往下执行
        typeof resFunc !== 'function' ? resFunc = value => value : null
        typeof rejectFunc !== 'function' ? rejectFunc = () => { 
            throw new Error('失败回调不为函数')
         } : null
        return new myPromise((resovle,reject)=>{
            const fulillFn = (val)=>{
                try{
                    let x = resFunc(val)
                    x instanceof myPromise ? x.then(resovle,reject) : resovle(x)
                }catch(err){
                    reject(val)
                }
            }
            
            const rejectedFn = (val)=>{
                try{
                    let x = rejectFunc(val)
                    x instanceof myPromise ? x.then(resovle,reject) : reject(x)
                }catch(val){
                    reject(val)
                }
            }
            switch(this._status){
                case 'pending':
                    this.resolveLists.push(fulillFn)
                    this.rejectLists.push(rejectedFn)
                    break
                case 'fulfilled':
                    fulillFn(this._value)
                    break
                case 'rejected':
                    rejectedFn(this._value)
                    break
            }

        })       
    }
    catch(rejectFn){
      this.then(undefined,rejectFn)
    }
    finally(callback){
      return this.then(
          value => myPromise.resovle(callback()).then(()=> value),
          reason => myPromise.reject(callback()).then(()=> { throw reason } )
      )
    }
    static resovle(value){
        if(value instanceof myPromise) return value
        return new myPromise(resovle=>resovle(value))
    }
    static reject(reason) {
        return new MyPromise((resolve, reject) => reject(reason))
      }
    static all (arr){
      let result = []
      let index = 0
      return new myPromise((resovle,reject)=>{
          arr.forEach((item,i)=>{
              item.then(val=>{
                  index ++
                  result[i] = val
                  index === arr.length ? resovle(result) : null

              },err=>{
                  reject(err)
              })
          })
      })
    }
    static race(arr){
        return new myPromise((resovle,reject)=>{
            arr.forEach(item=>{
                item.then(res=>{
                    resovle(res)
                },err=>{
                    reject(err)
                })
            })
        })
    }
}
const test = new myPromise((resovle,reject)=>{
    console.log('执行')
    // setTimeout(()=>{
        resovle(1)
    // })   
})
test.then((res)=>{
    console.log('输出',res)
    return 2
}).then(res=>{
    console.log('输出',res)
    return 3
}).then(res=>{
    console.log('输出',res)
})
